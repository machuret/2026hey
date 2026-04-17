# AutoPilot (Enterprise Edition)

Server-persisted, refresh-surviving, circuit-broken, optionally unattended pipeline orchestrator.

## TL;DR

```
[Start] ───► engine_autopilot_runs row (server state)
            │
            ▼
            /api/engine/autopilot/tick  ◄─────┐
                       │                     │
                       │                     │ poll every 2s
                       ▼                     │
            engine_autopilot_ticks row  ◄────┤ client
                       │                     │
                       ▼                     │
            counters updated on run  ◄───────┘
```

The browser is now a **view + trigger**, not the source of truth. Close the tab, reopen 5 minutes later → the run is still there with every tick logged.

## Architecture

| Layer | File | Role |
|-------|------|------|
| Schema | `supabase/migrations/20260419_autopilot_runs.sql` | Three tables + helper RPCs |
| Schema | `supabase/migrations/20260419_autopilot_cron.sql` | pg_cron + pg_net (Stage C) |
| Types | `src/lib/autopilot.ts` | Shared types + constants |
| Dispatcher | `src/lib/autopilotDispatch.ts` | Runs one tick: circuit check → budget check → claim → enrich → record |
| API: create | `src/app/api/engine/autopilot/start/route.ts` | POST — creates run (rejects if active) |
| API: execute | `src/app/api/engine/autopilot/tick/route.ts` | POST — runs next tick, persists |
| API: control | `src/app/api/engine/autopilot/control/route.ts` | POST — cancel / pause / resume |
| API: query | `src/app/api/engine/autopilot/runs/route.ts` | GET — list runs / active |
| API: detail | `src/app/api/engine/autopilot/runs/[id]/route.ts` | GET — run + ticks (supports `since_seq`) |
| API: circuits | `src/app/api/engine/autopilot/circuits/route.ts` | GET/POST — view + reset breakers |
| Hook | `src/hooks/useAutopilotRun.ts` | DB-backed client state + tick-driving loop |
| UI: overlay | `src/app/engine/jobs/components/AutoPilotV2.tsx` | Header panel on /engine/jobs pages |
| UI: history | `src/app/engine/autopilot/page.tsx` | List of past runs + circuit breakers |
| UI: detail | `src/app/engine/autopilot/[id]/page.tsx` | Per-run tick log + CSV export |

## Tables

### `engine_autopilot_runs`
One row per run. Immutable config at top; live counters updated per tick.

Key columns:
- `status` — `running` / `paused` / `completed` / `cancelled` / `failed`
- `stages` — `["analyze","find-dm"]` — which stages this run processes
- `batch_size`, `max_ticks` — safety limits
- `max_cost_usd` — per-run cost cap (nullable = daily-budget only)
- `ticks_completed`, `processed`, `analyzed`, `dms_found`, `failures`, `cost_usd` — live counters
- `finish_reason` — `done` / `max_ticks` / `budget` / `cost_cap` / `circuit` / `cancelled` / `error`
- `triggered_by` — `manual` / `cron`

### `engine_autopilot_ticks`
Append-only tick log. Every tick writes one row regardless of outcome.

### `engine_api_circuits`
One row per external API (`openai`, `apollo`, `apify`, `smartlead`). State machine:

```
closed ──(5 consecutive fails)──► open ──(5 min cooldown)──► half_open ──(next success)──► closed
                                                              │
                                                              └──(next fail)──► open
```

Helper RPCs:
- `engine_record_circuit_result(api, success, threshold, error)` — call after every API call
- `engine_is_circuit_open(api, cooldown_seconds)` — returns TRUE if tick should skip that stage

## Failure Modes Handled

| Failure | Handling |
|---------|----------|
| `ERR_NETWORK_IO_SUSPENDED` mid-tick | Client retries with exponential backoff + jitter (3 attempts) |
| 502 / 503 / 504 | Same retry policy |
| Browser/tab close | Server-persisted state survives; reload resumes view |
| Tab hidden (browser throttles) | Irrelevant if Stage C enabled (server drives ticks) |
| Upstream API broken | Circuit breaker trips after 5 consecutive fails; 5-min cooldown |
| Cost runaway | `max_cost_usd` per run + daily budget guard |
| OOM / hard crash mid-tick | Claim locks auto-release after 10 min |
| Multiple AutoPilots | `/start` enforces "one active run at a time" globally |
| User cancel mid-tick | Server flips status → next tick returns `skipped: true` |
| Run stuck "running" forever | `max_ticks` ceiling + per-tick timeout |
| Transient vs permanent error | `TransientApiError` → retry without incrementing job attempts |

## Lifecycle

### Client-driven (default)
1. User clicks **AutoPilot** in the header
2. Config panel (optional): stages, batch size, max ticks, cost cap
3. `POST /autopilot/start` → creates run, returns `run_id`
4. Hook begins:
   - Tick loop: `POST /autopilot/tick` in a while-loop with retries
   - Polling: `GET /autopilot/runs/:id?since_seq=N` every 2s for fresh ticks
5. Server-side each tick persists a `engine_autopilot_ticks` row before responding
6. User can pause/resume/cancel via `/control`
7. Closing the tab doesn't kill the run — the ticks continue queueing on reload

### Server-driven (Stage C — pg_cron)
1. Apply `20260419_autopilot_cron.sql`
2. Set two Postgres settings:
   ```sql
   ALTER DATABASE postgres SET app.settings.autopilot_tick_url   = 'https://YOUR.com/api/engine/autopilot/tick';
   ALTER DATABASE postgres SET app.settings.autopilot_admin_token = 'YOUR_ADMIN_SECRET';
   ```
3. Every 30s, pg_cron calls `engine_autopilot_cron_tick()` → HTTP POST to the tick endpoint
4. Your tab can be closed overnight; ticks keep flowing

Verify scheduler is running:
```sql
SELECT * FROM engine_autopilot_cron_status;
```

## UI Surfaces

- **Header (all /engine/jobs pages)** — Start / control button + expandable dashboard
- **/engine/autopilot** — History table + circuit breaker panel
- **/engine/autopilot/[id]** — Full tick log + CSV export
- **Every stage page** — Nav badges auto-refresh via `pipeline:refresh` event

## Config Reference

| Field | Default | Range | Purpose |
|-------|---------|-------|---------|
| `stages` | `["analyze","find-dm"]` | subset | Which stages to process |
| `batch_size` | 10 | 1-50 | Jobs per tick |
| `max_ticks` | 100 | 1-1000 | Hard ceiling per run |
| `max_cost_usd` | null | ≥ 0 | Stop at this cumulative spend |

## Deployment Checklist

```bash
# 1. Apply migrations (in Supabase SQL editor)
supabase/migrations/20260419_autopilot_runs.sql
supabase/migrations/20260419_autopilot_cron.sql   # only if you want server-driven

# 2. (Stage C only) Set pg_cron config
ALTER DATABASE postgres SET app.settings.autopilot_tick_url   = 'https://your-domain.com/api/engine/autopilot/tick';
ALTER DATABASE postgres SET app.settings.autopilot_admin_token = 'your-admin-secret';

# 3. Test
curl -X POST -H "Cookie: admin_token=$ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"batch_size":10,"max_cost_usd":5}' \
  $APP/api/engine/autopilot/start
```

## Known Gaps (Future Work)

- No desktop notification on run complete (Stage E)
- No per-job progress within a tick (batch is atomic)
- No alerting webhook (Slack/email)
- `pg_net` async HTTP has no retry/visibility — if a cron-fired tick fails, next one 30s later picks up the slack
- Cost cap is checked at tick-start, not mid-tick — a single batch could slightly overshoot

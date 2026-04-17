# heymoreleads

[![CI](https://github.com/machuret/2026hey/actions/workflows/ci.yml/badge.svg)](https://github.com/machuret/2026hey/actions/workflows/ci.yml)

Lead-generation engine for recruitment — scrape job postings, qualify with AI, find decision makers, push to CRM + SmartLead campaigns.

## Pipeline

```
Scrape → Enrich (AI analysis + DM lookup) → Send (SmartLead / CRM)
```

UI lives at `/engine/jobs/*` with a simplified 3-tab flow (Scraped / Ready / Sent) and optional advanced drill-downs.

## Stack

- **Next.js 16** (App Router) + React 18 + TypeScript
- **Supabase** (Postgres, Auth, Edge Functions) — service-role for all mutations
- **TailwindCSS** + **lucide-react**
- **Vitest** for unit + E2E tests

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in SUPABASE + SMARTLEAD keys
npm run dev
```

### Required environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_SECRET                 # cookie-based auth for /engine and /admin
SMARTLEAD_API_KEY            # used by supabase/functions/smartleads
```

## Scripts

```bash
npm run dev         # Next dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint (errors block CI, warnings allowed)
npm test            # vitest (74 tests — 21 E2E)
npm run test:watch  # watch mode
```

## Database migrations

Apply in order from `supabase/migrations/`:

```
20260418_pipeline_stage_machine.sql
20260418_smartlead_integration.sql
20260419_autopilot_runs.sql          # AutoPilot persistence + circuit breakers
20260419_autopilot_cron.sql          # (optional) pg_cron for server-driven ticks
```

For AutoPilot unattended mode, set:

```sql
ALTER DATABASE postgres SET app.settings.autopilot_tick_url    = 'https://YOUR.com/api/engine/autopilot/tick';
ALTER DATABASE postgres SET app.settings.autopilot_admin_token = 'YOUR_ADMIN_SECRET';
```

## Key routes

| URL | Purpose |
|-----|---------|
| `/engine/jobs/scrape`     | Source scraping |
| `/engine/jobs/scraped`    | Awaiting enrichment — unified Enrich button |
| `/engine/jobs/ready`      | DM-enriched, ready to send |
| `/engine/jobs/sent`       | Archive (CRM + SmartLead) |
| `/engine/autopilot`       | Run history + circuit breaker admin |
| `/engine/debug`           | System diagnostic — counts, recent activity, API errors |

## Docs

- [`docs/autopilot.md`](docs/autopilot.md) — AutoPilot architecture, failure modes, deployment
- [`docs/smartlead.md`](docs/smartlead.md) — SmartLead integration

## CI

Every push to `main` and every PR runs three parallel jobs (typecheck / lint / test) via `.github/workflows/ci.yml`. Failures block merge once branch protection is enabled.

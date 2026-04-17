# SmartLead Integration

Push enriched job leads into [SmartLead](https://smartlead.ai) cold-email campaigns as the final step of the outbound pipeline.

## Pipeline Position

```
Scrape → Analyze (AI) → Find DM (Apollo) → Enrich → ┬──► Push to CRM
                                                    └──► Push to SmartLead  ← this doc
```

A lead can go to CRM, SmartLead, or both. SmartLead is **terminal** (`VALID_TRANSITIONS.smartleaded = []`).

## Architecture

| Layer | File | Responsibility |
|-------|------|----------------|
| Edge function | `supabase/functions/smartleads/index.ts` | Dispatcher with `ping`, `list_campaigns`, `add_leads`. Calls SmartLead REST API with `?api_key=` |
| Next API route | `src/app/api/engine/smartlead/route.ts` | Auth, DB lookup, lead mapping, batching, status updates, audit logging |
| Shared helpers | `src/lib/smartlead.ts` | Pure functions: `jobToSmartLead`, `bestEmail`, `splitName`, `chunk`, constants |
| UI | `src/app/engine/jobs/components/SmartLeadActions.tsx` | Campaign picker + push button on the Enriched tab |
| Campaigns hook | `src/hooks/useSmartLeadCampaigns.ts` | Loads campaign list |
| Push hook | `src/hooks/useEngineAction.ts` | Generic POST with loading/error/msg state |

## Environment Variables

### Next.js (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_SECRET=...
```

### Supabase edge-function secrets
```bash
supabase secrets set SMARTLEAD_API_KEY=<your key>
# Optional default so `campaign_id` can be omitted:
supabase secrets set SMARTLEAD_DEFAULT_CAMPAIGN_ID=<numeric id>
```

## API Reference

### `GET /api/engine/smartlead?action=ping`
Validates the SmartLead API key. Returns `{ success, default_campaign_id }`.

### `GET /api/engine/smartlead?action=campaigns`
Returns `{ success, count, campaigns: [{ id, name, status, created_at, ... }] }`.

### `POST /api/engine/smartlead`
Pushes selected jobs to a campaign.

**Request**
```ts
{
  jobIds: string[];              // job_leads.id values
  campaignId: string | number;   // SmartLead campaign id (from list_campaigns)
  campaignName?: string;         // stored on the job row for UI display
}
```

**Response**
```ts
{
  success:          boolean;     // false if any batch failed
  partial_success?: boolean;     // some batches OK, others not
  campaign_id:      string;
  total_sent:       number;      // leads sent (had valid email)
  uploaded:         number;      // SmartLead accepted
  duplicates:       number;      // already in campaign
  invalid:          number;      // SmartLead rejected (blocklist/bounce/malformed)
  skipped_no_email: number;      // filtered before sending
  db_sync_failed?:  boolean;     // SmartLead has the leads, DB update failed
  errors?:          string[];
}
```

## Data Flow: Push

```
UI button click
  → POST /api/engine/smartlead { jobIds, campaignId }
    → db.select job_leads where id in (jobIds) and status in (PUSHABLE_STATUSES)
    → map to SmartLead LeadIn[] via jobToSmartLead()  (drops leads with no valid email)
    → chunk(leads, 100)
    → for each batch:
        → POST smartleads edge fn { action:"add_leads", campaign_id, leads }
          → SmartLead /campaigns/{id}/leads
        → log engine_api_usage { api:"smartlead", operation:"add_leads", latency, success }
        → on success: accumulate uploaded/duplicates/invalid counts
    → db.update job_leads set status='pushed_to_smartlead' where id in (successfulJobIds)
    → db.insert engine_stage_transitions (from_stage → smartleaded)
  ← aggregate response
```

## SmartLead Custom Fields

Each pushed lead carries these `custom_fields` for email template interpolation (empty values are omitted):

| Key | Source | Example |
|-----|--------|---------|
| `job_title` | `job_leads.job_title` | "Senior Cloud Architect" |
| `job_url` | `job_leads.job_url` | `https://seek.com.au/job/12345` |
| `source` | `job_leads.source` | `seek` / `indeed` / `linkedin` |
| `country` | `job_leads.country` | `AU` |
| `dm_title` | `job_leads.dm_title` | "VP Engineering" |
| `salary` | `job_leads.salary` | "$150k + super" |
| `work_type` / `work_arrangement` | `job_leads.work_*` | "Full-time" / "Hybrid" |
| `company_industry` / `company_size` | various | "SaaS" / "51-200" |
| `company_summary` | `ai_company_summary` | AI-generated one-liner |
| `pitch_angle` | `ai_pitch_angle` | Why they'd need our service |
| `email_snippet` | `ai_email_snippet` | Pre-baked opening line |
| `hiring_signal` | `ai_hiring_signal` | "Scaling team, posted 3 roles this week" |
| `candidate_persona` | `ai_candidate_persona` | "Senior backend dev, 5+ yrs cloud" |
| `relevance_score` | `ai_relevance_score` | `7` (numeric) |

Use them in SmartLead templates as `{{job_title}}`, `{{pitch_angle}}`, etc.

## Database Schema

Migration: `supabase/migrations/20260418_smartlead_integration.sql`

Added to `job_leads`:

| Column | Type | Purpose |
|--------|------|---------|
| `smartlead_campaign_id` | text | SmartLead campaign the lead was pushed into |
| `smartlead_campaign_name` | text | Cached campaign name for UI |
| `smartlead_lead_id` | text | (reserved — SmartLead per-lead id if we ever fetch it) |
| `smartlead_pushed_at` | timestamptz | When the push happened |
| `smartlead_error` | text | Last error for this lead (set on failed batch, cleared on success) |

New status: `pushed_to_smartlead` (added to `status` CHECK constraint and to `PipelineStage` as `"smartleaded"`).

## Retry Behaviour

- If SmartLead returns `invalid > 0` for a batch, we mark **only the accepted portion** as pushed. Invalid jobs stay in their prior status, eligible for future retry after fixing data.
- If a whole batch fails (HTTP 5xx / timeout), **no jobs in that batch** are marked as pushed; `smartlead_error` is stamped so the UI can show why.
- If SmartLead succeeds but the DB update fails, response includes `db_sync_failed: true`. Next push will re-send (SmartLead dedups server-side).

## Known Limitations

1. **No per-lead error mapping.** SmartLead's `add_leads` response is aggregate, so when `invalid > 0` we can only mark an *approximate* successful subset. See `route.ts` inline comment.
2. **No reply tracking.** Replies/bounces/unsubscribes do NOT flow back to our DB. A `smartlead-webhook` edge function is on the TODO list.
3. **Name parsing is best-effort.** `splitName` handles simple salutations but not hyphenated or multi-part last names perfectly.
4. **Campaign list has no pagination.** SmartLead returns all campaigns at once; fine for <500.

## Testing

```bash
npm test                 # runs pipelineStage + smartlead unit tests
```

Key test files:
- `src/lib/smartlead.test.ts` — `jobToSmartLead`, email/phone selection, name splitting, chunking
- `src/lib/pipelineStage.test.ts` — the `smartleaded` stage transition and terminal behaviour

## Deployment Checklist

```bash
# 1. Apply migration (paste into Supabase SQL editor)
cat supabase/migrations/20260418_smartlead_integration.sql

# 2. Deploy edge function
npx supabase functions deploy smartleads

# 3. Set secrets (if not already)
npx supabase secrets set SMARTLEAD_API_KEY=<key>

# 4. Smoke test
curl "$APP_URL/api/engine/smartlead?action=ping" \
  -H "Cookie: admin_token=$ADMIN_SECRET"
```

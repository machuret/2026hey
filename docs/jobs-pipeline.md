# Job Scraper Pipeline

Multi-source job scraping → AI analysis → decision-maker enrichment → CRM push.

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────────┐    ┌──────────────┐
│  1. Scrape   │ →  │  2. Enrich    │ →  │  3. Enriched (View)  │ →  │  4. Review   │
│  Seek/Indeed │    │  AI→DMs→LI   │    │  Stats + Pagination  │    │  Push to CRM │
│  /LinkedIn   │    │  Auto-batch   │    │                      │    │              │
└─────────────┘    └──────────────┘    └──────────────────────┘    └──────────────┘
```

## Pipeline Steps

### 1. Scrape
- Sources: Seek (AU/NZ), Indeed (US/Global), LinkedIn (Global)
- Fields: search term, location, country, max results, date range, work type, **industry/category**
- Industry persisted as `job_category` in Supabase
- Runs via Apify actors through `/api/engine/jobs/scrape`

### 2. Enrich (3-step pipeline)

| Step | Method | Provider | What it does |
|------|--------|----------|-------------|
| AI Analysis | `ai` | OpenAI `gpt-4o-mini` | Deep classification: recruiter detection, relevance scoring, role analysis, hiring intelligence, cold email building blocks |
| Decision Makers | `apollo` | Apollo via Apify | 2-step: find person → enrich email + phone |
| LinkedIn Intel | `linkedin` | LinkedIn via Apify | Company description, size, industry, HQ location |

**Auto-batching**: Max 50 jobs per batch (edge function limit). Client auto-chunks larger sets with 1.5s pauses between batches.

**Recruiter auto-dismiss**: If AI classifies `poster_type = "agency_recruiter"`, the job is auto-dismissed and skipped in subsequent pipeline steps.

### 3. Enriched
- Filters jobs by enriched status (`ai_enriched`, `dm_enriched`, `fully_enriched`)
- Stats: total enriched, with DM contact, fully enriched, avg AI score
- Paginated at 50 per page

### 4. Review & Push
- Select enriched jobs → push to `crm_leads` table
- Deduplicates against existing CRM leads by email/phone
- Dismiss unwanted jobs

## AutoPilot Mode

One-click automation: Scrape → Save → Select All → Enrich All (full pipeline).

State machine phases: `idle → scraping → saving → loading_saved → enriching → done | error`

Cancellable at any point.

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/engine/jobs` | GET | Cookie | List jobs with filters |
| `/api/engine/jobs/scrape` | POST | Cookie | Trigger Apify scrape |
| `/api/engine/jobs/import` | POST | Cookie | Save scraped jobs to DB |
| `/api/engine/jobs/enrich` | POST | Cookie | Proxy to enrichment edge fn |
| `/api/engine/jobs/[id]` | PATCH | Cookie | Update single job (allowlisted fields) |
| `/api/engine/jobs/[id]` | DELETE | Cookie | Delete single job |
| `/api/engine/jobs/push-to-crm` | POST | Cookie | Push to CRM with dedup |

**Auth**: All routes require `admin_token` cookie (same as `/admin`). Edge function validates `Authorization: Bearer <SERVICE_ROLE_KEY>`.

## Key Files

| File | Purpose |
|------|---------|
| `src/app/engine/jobs/page.tsx` | Main page component with tabs + AutoPilot |
| `src/app/engine/jobs/types.ts` | Shared types, constants, categories |
| `src/hooks/useJobPipeline.ts` | All React hooks (scrape, list, enrich, push, state) |
| `src/app/engine/jobs/components/` | Tab components (Scrape, Enrich, Enriched, Review) |
| `src/lib/engineAuth.ts` | Auth helper for engine API routes |
| `supabase/functions/engine-jobs-enrich/` | Edge function (AI + Apollo + LinkedIn) |
| `supabase/engine_job_leads.sql` | Database schema |

## Database

Table: `job_leads` — see `supabase/engine_job_leads.sql`

Key columns:
- **Core**: `source_id`, `source`, `job_title`, `company_name`, `job_category`
- **AI fields** (20+): `ai_relevance_score`, `ai_poster_type`, `ai_role_seniority`, `ai_pitch_angle`, etc.
- **DM fields**: `dm_name`, `dm_email`, `dm_phone`, `dm_linkedin_url`
- **LinkedIn fields**: `li_company_url`, `li_industry`, `li_company_size`
- **Status**: `new → ai_enriched → dm_enriched → fully_enriched → pushed_to_crm`

Migration for `job_category`: `supabase/migrations/20260417_add_job_category.sql`

-- ═══════════════════════════════════════════════════════════════════════════
-- Pipeline Stage Machine — supporting columns + audit + budget tracking
-- ═══════════════════════════════════════════════════════════════════════════

-- ── job_leads: retry + failure tracking ────────────────────────────────────
ALTER TABLE job_leads
  ADD COLUMN IF NOT EXISTS ai_attempts       INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dm_attempts       INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS li_attempts       INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dm_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS ai_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS li_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_error        TEXT,
  ADD COLUMN IF NOT EXISTS next_retry_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_cost_usd    NUMERIC(10,4) NOT NULL DEFAULT 0;

-- Index for the worker to find jobs eligible for processing
CREATE INDEX IF NOT EXISTS idx_job_leads_pipeline_worker
  ON job_leads (status, ai_enriched_at, dm_enriched_at, next_retry_at)
  WHERE status NOT IN ('pushed_to_crm', 'dismissed', 'recruiter_dismissed');

-- Index for "stuck" jobs (qualified but no DM after N attempts)
CREATE INDEX IF NOT EXISTS idx_job_leads_stuck
  ON job_leads (dm_attempts)
  WHERE ai_enriched_at IS NOT NULL AND dm_name IS NULL AND dm_attempts >= 3;

-- ── engine_stage_transitions: audit log ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS engine_stage_transitions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID NOT NULL REFERENCES job_leads(id) ON DELETE CASCADE,
  from_stage   TEXT NOT NULL,
  to_stage     TEXT NOT NULL,
  reason       TEXT,
  cost_usd     NUMERIC(10,4) DEFAULT 0,
  duration_ms  INT,
  success      BOOLEAN NOT NULL DEFAULT true,
  error_msg    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stage_transitions_job ON engine_stage_transitions (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_transitions_stage ON engine_stage_transitions (to_stage, created_at DESC);

ALTER TABLE engine_stage_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny anon access on stage_transitions"
  ON engine_stage_transitions
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ── engine_api_usage: every API call logged ────────────────────────────────
CREATE TABLE IF NOT EXISTS engine_api_usage (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api        TEXT NOT NULL,      -- 'apify', 'openai', 'apollo', 'linkedin'
  operation  TEXT NOT NULL,      -- 'scrape', 'analyze', 'find_dm', 'company_intel'
  job_id     UUID REFERENCES job_leads(id) ON DELETE SET NULL,
  cost_usd   NUMERIC(10,4) NOT NULL DEFAULT 0,
  latency_ms INT,
  success    BOOLEAN NOT NULL,
  status_code INT,
  error_msg  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_daily ON engine_api_usage (api, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_job ON engine_api_usage (job_id);

ALTER TABLE engine_api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny anon access on api_usage"
  ON engine_api_usage
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ── engine_api_budgets: daily caps per API ─────────────────────────────────
CREATE TABLE IF NOT EXISTS engine_api_budgets (
  api              TEXT PRIMARY KEY,           -- 'apify', 'openai', 'apollo', 'linkedin'
  daily_cap_usd    NUMERIC(10,4) NOT NULL,
  daily_call_cap   INT NOT NULL DEFAULT 10000,
  is_paused        BOOLEAN NOT NULL DEFAULT false,
  pause_reason     TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO engine_api_budgets (api, daily_cap_usd, daily_call_cap) VALUES
  ('apify',    50.00, 1000),
  ('openai',   20.00, 5000),
  ('apollo',   30.00, 2000),
  ('linkedin', 20.00, 500)
ON CONFLICT (api) DO NOTHING;

ALTER TABLE engine_api_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny anon access on api_budgets"
  ON engine_api_budgets
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ── Helper view: today's spend per API ─────────────────────────────────────
CREATE OR REPLACE VIEW engine_api_spend_today AS
SELECT
  api,
  COUNT(*)                           AS call_count,
  SUM(cost_usd)                      AS total_cost_usd,
  SUM(CASE WHEN success THEN 0 ELSE 1 END) AS failure_count,
  AVG(latency_ms)::INT               AS avg_latency_ms
FROM engine_api_usage
WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')
GROUP BY api;

-- ── Helper view: pipeline stage breakdown ──────────────────────────────────
CREATE OR REPLACE VIEW engine_pipeline_stats AS
SELECT
  CASE
    WHEN status IN ('pushed_to_crm')                                          THEN 'pushed'
    WHEN status IN ('dismissed', 'recruiter_dismissed')                       THEN 'dismissed'
    WHEN dm_name IS NOT NULL AND (dm_email IS NOT NULL OR dm_linkedin_url IS NOT NULL) THEN 'enriched'
    WHEN ai_enriched_at IS NOT NULL AND dm_attempts >= 3 AND dm_name IS NULL  THEN 'stuck_no_dm'
    WHEN ai_enriched_at IS NOT NULL AND ai_relevance_score >= 6 AND ai_poster_type = 'internal' THEN 'qualified'
    WHEN ai_enriched_at IS NOT NULL                                           THEN 'dead_end'
    ELSE 'pending'
  END AS stage,
  COUNT(*)       AS job_count,
  MAX(updated_at) AS last_updated
FROM job_leads
GROUP BY stage;

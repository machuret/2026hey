-- ═══════════════════════════════════════════════════════════════════════════
-- SmartLead integration — track pushes to SmartLead campaigns
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE job_leads
  ADD COLUMN IF NOT EXISTS smartlead_campaign_id   TEXT,
  ADD COLUMN IF NOT EXISTS smartlead_campaign_name TEXT,
  ADD COLUMN IF NOT EXISTS smartlead_lead_id       TEXT,
  ADD COLUMN IF NOT EXISTS smartlead_pushed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS smartlead_error         TEXT;

-- Extend status enum to include 'pushed_to_smartlead'
ALTER TABLE job_leads DROP CONSTRAINT IF EXISTS job_leads_status_check;
ALTER TABLE job_leads ADD CONSTRAINT job_leads_status_check
  CHECK (status IN (
    'new',
    'ai_enriched',
    'dm_enriched',
    'fully_enriched',
    'pushed_to_crm',
    'pushed_to_smartlead',
    'dismissed',
    'recruiter_dismissed'
  ));

-- Rebuild pipeline worker index to exclude smartleaded jobs
DROP INDEX IF EXISTS idx_job_leads_pipeline_worker;
CREATE INDEX IF NOT EXISTS idx_job_leads_pipeline_worker
  ON job_leads (status, ai_enriched_at, dm_enriched_at, next_retry_at)
  WHERE status NOT IN ('pushed_to_crm', 'pushed_to_smartlead', 'dismissed', 'recruiter_dismissed');

-- Lookup index for campaign reporting
CREATE INDEX IF NOT EXISTS idx_job_leads_smartlead
  ON job_leads (smartlead_campaign_id, smartlead_pushed_at DESC)
  WHERE smartlead_pushed_at IS NOT NULL;

-- Update pipeline_stats view to show smartlead as a terminal stage
CREATE OR REPLACE VIEW engine_pipeline_stats AS
SELECT
  CASE
    WHEN status = 'pushed_to_smartlead'                                       THEN 'smartleaded'
    WHEN status = 'pushed_to_crm'                                             THEN 'pushed'
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

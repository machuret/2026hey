-- ══════════════════════════════════════════════════════════════════
-- Add deep AI classification fields to job_leads
-- Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════════

-- Recruiter classification (auto-dismiss gate)
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_poster_type          text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_poster_reason        text;

-- Role classification
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_role_seniority       text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_role_function        text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_required_skills      text[] DEFAULT '{}';
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_required_experience  text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_required_certifications text[] DEFAULT '{}';
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_employment_type      text;

-- Hiring intelligence
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_urgency              text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_urgency_clues        text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_team_size_clue       text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_reports_to           text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_company_pain_points  text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_work_model           text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_industry_vertical    text;

-- Compensation
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_salary_normalized    text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_benefits_summary     text;

-- Cold email building blocks
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_candidate_persona    text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_pitch_angle          text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_email_snippet        text;
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS ai_objection_preempt    text;

-- Update status check constraint to include recruiter_dismissed
ALTER TABLE job_leads DROP CONSTRAINT IF EXISTS job_leads_status_check;
ALTER TABLE job_leads ADD CONSTRAINT job_leads_status_check
  CHECK (status IN ('new','ai_enriched','dm_enriched','fully_enriched','pushed_to_crm','dismissed','recruiter_dismissed'));

-- Index for poster type filtering
CREATE INDEX IF NOT EXISTS job_leads_poster_type_idx ON job_leads (ai_poster_type);

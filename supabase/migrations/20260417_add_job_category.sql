-- Add job_category column to store the industry/category selected during scrape
ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS job_category text;

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_job_leads_category ON job_leads (job_category);

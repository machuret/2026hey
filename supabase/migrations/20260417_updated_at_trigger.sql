-- Auto-update updated_at on every UPDATE — no longer relies on app code
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- job_leads
DROP TRIGGER IF EXISTS trg_job_leads_updated_at ON job_leads;
CREATE TRIGGER trg_job_leads_updated_at
  BEFORE UPDATE ON job_leads
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- job_saved_searches (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_saved_searches') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_job_saved_searches_updated_at ON job_saved_searches';
    -- job_saved_searches might not have updated_at; skip if missing
  END IF;
END $$;

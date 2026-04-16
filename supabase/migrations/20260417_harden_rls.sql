-- Harden RLS: restrict job_leads to service_role only (not anon)
-- The old policy "using (true)" allowed any authenticated user or even anon key to read/write.

DROP POLICY IF EXISTS "service role full access on job_leads" ON job_leads;

-- Service role bypasses RLS by default in Supabase, so we don't need an explicit policy.
-- But we need to DENY anon/authenticated roles explicitly:
CREATE POLICY "deny anon access on job_leads"
  ON job_leads
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Same for crm_leads if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads') THEN
    EXECUTE 'DROP POLICY IF EXISTS "service role full access on crm_leads" ON crm_leads';
    EXECUTE 'CREATE POLICY "deny anon access on crm_leads" ON crm_leads FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;

-- Same for job_saved_searches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_saved_searches') THEN
    EXECUTE 'DROP POLICY IF EXISTS "service role full access on job_saved_searches" ON job_saved_searches';
    EXECUTE 'CREATE POLICY "deny anon access on job_saved_searches" ON job_saved_searches FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;

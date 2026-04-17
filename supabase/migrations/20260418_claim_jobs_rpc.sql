-- ═══════════════════════════════════════════════════════════════════════════
-- Concurrency-safe claim functions for the pipeline worker.
--
-- Problem: two tick workers (two tabs, cron + manual) race on the same batch.
-- Both fetch the same pending jobs, both spend API $, both increment attempts.
--
-- Solution: atomic claim via UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED)
-- The row-level lock + RETURNING gives each worker a disjoint batch.
-- We use `next_retry_at` as a soft lock (set to now() + 10min when claimed);
-- if the worker crashes mid-process, the lock expires and the job is retriable.
-- ═══════════════════════════════════════════════════════════════════════════

-- Claim pending jobs (awaiting AI analysis).
CREATE OR REPLACE FUNCTION engine_claim_jobs_for_analyze(batch_size INT DEFAULT 20)
RETURNS SETOF job_leads
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE job_leads
  SET next_retry_at = now() + interval '10 minutes',
      updated_at    = now()
  WHERE id IN (
    SELECT id FROM job_leads
    WHERE ai_enriched_at IS NULL
      AND ai_attempts < 2
      AND status NOT IN ('pushed_to_crm', 'dismissed', 'recruiter_dismissed')
      AND (next_retry_at IS NULL OR next_retry_at < now())
    ORDER BY created_at ASC
    LIMIT GREATEST(1, LEAST(batch_size, 50))
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;

-- Claim qualified jobs (AI done, relevant, awaiting DM search).
CREATE OR REPLACE FUNCTION engine_claim_jobs_for_dm(batch_size INT DEFAULT 10)
RETURNS SETOF job_leads
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE job_leads
  SET next_retry_at = now() + interval '10 minutes',
      updated_at    = now()
  WHERE id IN (
    SELECT id FROM job_leads
    WHERE ai_enriched_at IS NOT NULL
      AND ai_relevance_score >= 6
      AND ai_poster_type = 'internal'
      AND dm_name IS NULL
      AND dm_attempts < 3
      AND status NOT IN ('pushed_to_crm', 'dismissed', 'recruiter_dismissed')
      AND (next_retry_at IS NULL OR next_retry_at < now())
    ORDER BY ai_enriched_at ASC
    LIMIT GREATEST(1, LEAST(batch_size, 50))
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;

-- Lock down execution: only the service role should be able to call these.
REVOKE EXECUTE ON FUNCTION engine_claim_jobs_for_analyze(INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION engine_claim_jobs_for_dm(INT)      FROM PUBLIC, anon, authenticated;
-- service_role retains exec via its BYPASSRLS + owner role membership.

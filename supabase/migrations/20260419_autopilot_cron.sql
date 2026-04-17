-- ═══════════════════════════════════════════════════════════════════════════
-- Stage C — Server-driven AutoPilot ticks via pg_cron + pg_net
--
-- What this does:
--   Every 30 seconds, a Postgres cron job finds the active AutoPilot run
--   (if any) and POSTs to /api/engine/autopilot/tick to advance it.
--   This means runs continue EVEN WHEN THE BROWSER IS CLOSED.
--
-- Requirements (set once per project):
--   1. `pg_cron` and `pg_net` extensions enabled
--   2. Two Postgres config values:
--        app.settings.autopilot_tick_url   → https://your-app.com/api/engine/autopilot/tick
--        app.settings.autopilot_admin_token → the value of ADMIN_SECRET
--      Set via `ALTER DATABASE postgres SET app.settings.X = 'value';`
--   3. Supabase project must allow outbound http (pg_net is supported out-of-box)
--
-- Safety:
--   - Only one active run exists at a time (enforced by /start endpoint)
--   - If the URL/token aren't configured, the cron is a no-op (logs and skips)
--   - Idempotent: if a tick is already in-flight, the next tick's claim RPC
--     will return 0 jobs — harmless.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Driver fn ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION engine_autopilot_cron_tick() RETURNS void AS $$
DECLARE
  v_run      engine_autopilot_runs%ROWTYPE;
  v_url      TEXT := current_setting('app.settings.autopilot_tick_url',  TRUE);
  v_token    TEXT := current_setting('app.settings.autopilot_admin_token', TRUE);
BEGIN
  IF v_url IS NULL OR v_token IS NULL THEN
    RAISE WARNING '[autopilot-cron] app.settings not configured — skipping';
    RETURN;
  END IF;

  SELECT * INTO v_run
    FROM engine_autopilot_runs
   WHERE status = 'running'
   ORDER BY created_at DESC
   LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;  -- no active run

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Cookie',       'admin_token=' || v_token
    ),
    body    := jsonb_build_object('run_id', v_run.id),
    timeout_milliseconds := 290_000
  );

  -- We don't wait on the response. pg_net queues it and fires async; the Next
  -- endpoint persists its own tick row, so there's no state to capture here.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION engine_autopilot_cron_tick() IS
  'Fires one AutoPilot tick. Called by pg_cron every 30s. Uses app.settings for URL + token.';

-- ── Schedule ───────────────────────────────────────────────────────────────
-- Unschedule existing job (if any) to make this migration idempotent.
DO $$
DECLARE
  v_jobid INTEGER;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'engine-autopilot-tick';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
END $$;

-- Run every 30s. pg_cron's granularity is 1 min for the standard schedule
-- syntax, but supports sub-minute via seconds-syntax (introduced in pg_cron 1.5).
SELECT cron.schedule(
  'engine-autopilot-tick',
  '30 seconds',
  $cron$ SELECT engine_autopilot_cron_tick(); $cron$
);

-- ── Helper view for debugging ──────────────────────────────────────────────
CREATE OR REPLACE VIEW engine_autopilot_cron_status AS
SELECT j.jobname, j.schedule, j.active,
       r.runid, r.start_time, r.end_time, r.status, r.return_message
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT * FROM cron.job_run_details WHERE jobid = j.jobid
    ORDER BY start_time DESC LIMIT 1
  ) r ON TRUE
 WHERE j.jobname LIKE 'engine-autopilot%';

COMMENT ON VIEW engine_autopilot_cron_status IS
  'Last run status for the AutoPilot pg_cron job. Query this to confirm the scheduler is alive.';

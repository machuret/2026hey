-- ═══════════════════════════════════════════════════════════════════════════
-- AutoPilot enterprise schema
--
-- Three tables:
--   engine_autopilot_runs    — one row per run, survives browser close
--   engine_autopilot_ticks   — one row per tick (append-only log)
--   engine_api_circuits      — circuit-breaker state per external API
--
-- Design notes:
--   - Runs are NEVER deleted; history is permanent for audit
--   - Ticks cascade with their run (clean history page queries)
--   - All state is read-through the run row; client polls it
-- ═══════════════════════════════════════════════════════════════════════════

-- ── engine_autopilot_runs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS engine_autopilot_runs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  status          TEXT        NOT NULL DEFAULT 'running'
                              CHECK (status IN ('running','paused','completed','cancelled','failed')),

  -- Run config (set at start, immutable)
  stages          TEXT[]      NOT NULL DEFAULT ARRAY['analyze','find-dm']::text[],
  batch_size      INTEGER     NOT NULL DEFAULT 10 CHECK (batch_size BETWEEN 1 AND 50),
  max_ticks       INTEGER     NOT NULL DEFAULT 100 CHECK (max_ticks BETWEEN 1 AND 1000),
  max_cost_usd    NUMERIC     NULL, -- NULL = no cap

  -- Live counters (updated after each tick)
  ticks_completed INTEGER     NOT NULL DEFAULT 0,
  processed       INTEGER     NOT NULL DEFAULT 0,
  analyzed        INTEGER     NOT NULL DEFAULT 0,
  dms_found       INTEGER     NOT NULL DEFAULT 0,
  failures        INTEGER     NOT NULL DEFAULT 0,
  cost_usd        NUMERIC     NOT NULL DEFAULT 0,

  -- Pause/resume tracking (for fair time accounting later)
  paused_at       TIMESTAMPTZ NULL,

  -- Termination
  finished_at     TIMESTAMPTZ NULL,
  finish_reason   TEXT        NULL, -- 'done'|'max_ticks'|'budget'|'cancelled'|'error'|'cost_cap'
  last_error      TEXT        NULL,

  -- Metadata
  triggered_by    TEXT        NOT NULL DEFAULT 'manual', -- 'manual'|'cron'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autopilot_runs_status
  ON engine_autopilot_runs (status, created_at DESC)
  WHERE status IN ('running','paused');

CREATE INDEX IF NOT EXISTS idx_autopilot_runs_recent
  ON engine_autopilot_runs (created_at DESC);

-- ── engine_autopilot_ticks ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS engine_autopilot_ticks (
  id            BIGSERIAL   PRIMARY KEY,
  run_id        UUID        NOT NULL REFERENCES engine_autopilot_runs(id) ON DELETE CASCADE,
  seq           INTEGER     NOT NULL, -- 1-based within a run

  -- What happened
  stage         TEXT        NOT NULL, -- 'analyze'|'find-dm'|'—'
  status        TEXT        NOT NULL CHECK (status IN ('ok','retry','fail','budget','done','circuit_open','cost_cap')),
  message       TEXT        NOT NULL,

  -- Metrics
  processed     INTEGER     NOT NULL DEFAULT 0,
  successes     INTEGER     NOT NULL DEFAULT 0,
  failures      INTEGER     NOT NULL DEFAULT 0,
  cost_usd      NUMERIC     NOT NULL DEFAULT 0,
  duration_ms   INTEGER     NULL,

  -- Error details (when status != 'ok')
  retry_num     INTEGER     NULL,
  error_code    TEXT        NULL,

  at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_autopilot_ticks_run
  ON engine_autopilot_ticks (run_id, seq);

-- ── engine_api_circuits ───────────────────────────────────────────────────
-- Per-API circuit breaker. Trips after N consecutive failures, auto-closes
-- after a cool-down window.
CREATE TABLE IF NOT EXISTS engine_api_circuits (
  api                TEXT        PRIMARY KEY, -- 'openai'|'apollo'|'apify'|'smartlead'
  state              TEXT        NOT NULL DEFAULT 'closed'
                                 CHECK (state IN ('closed','open','half_open')),
  consecutive_fails  INTEGER     NOT NULL DEFAULT 0,
  opened_at          TIMESTAMPTZ NULL,
  last_error         TEXT        NULL,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed so circuit state is queryable from the start.
INSERT INTO engine_api_circuits (api) VALUES
  ('openai'), ('apollo'), ('apify'), ('smartlead')
ON CONFLICT (api) DO NOTHING;

-- ── Helper fn: update updated_at ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION engine_autopilot_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_autopilot_runs_updated_at     ON engine_autopilot_runs;
DROP TRIGGER IF EXISTS trg_autopilot_circuits_updated_at ON engine_api_circuits;

CREATE TRIGGER trg_autopilot_runs_updated_at
  BEFORE UPDATE ON engine_autopilot_runs
  FOR EACH ROW EXECUTE FUNCTION engine_autopilot_touch_updated_at();

CREATE TRIGGER trg_autopilot_circuits_updated_at
  BEFORE UPDATE ON engine_api_circuits
  FOR EACH ROW EXECUTE FUNCTION engine_autopilot_touch_updated_at();

-- ── Helper fn: record_circuit_result ──────────────────────────────────────
-- Call after every external API call. Success clears consecutive_fails;
-- failure increments and trips the breaker at the threshold.
CREATE OR REPLACE FUNCTION engine_record_circuit_result(
  p_api       TEXT,
  p_success   BOOLEAN,
  p_threshold INTEGER DEFAULT 5,
  p_error     TEXT    DEFAULT NULL
) RETURNS TEXT AS $$  -- returns new state
DECLARE
  v_new_state TEXT;
BEGIN
  IF p_success THEN
    UPDATE engine_api_circuits
       SET state             = 'closed',
           consecutive_fails = 0,
           opened_at         = NULL,
           last_error        = NULL
     WHERE api = p_api
    RETURNING state INTO v_new_state;
  ELSE
    UPDATE engine_api_circuits
       SET consecutive_fails = consecutive_fails + 1,
           last_error        = p_error,
           state             = CASE
             WHEN consecutive_fails + 1 >= p_threshold THEN 'open'
             ELSE state
           END,
           opened_at         = CASE
             WHEN consecutive_fails + 1 >= p_threshold AND opened_at IS NULL THEN NOW()
             ELSE opened_at
           END
     WHERE api = p_api
    RETURNING state INTO v_new_state;
  END IF;

  IF v_new_state IS NULL THEN
    -- Seed row if somehow missing
    INSERT INTO engine_api_circuits (api, state, consecutive_fails, last_error, opened_at)
    VALUES (
      p_api,
      CASE WHEN p_success THEN 'closed' ELSE 'closed' END,
      CASE WHEN p_success THEN 0 ELSE 1 END,
      p_error,
      NULL
    )
    ON CONFLICT (api) DO NOTHING
    RETURNING state INTO v_new_state;
  END IF;

  RETURN COALESCE(v_new_state, 'closed');
END;
$$ LANGUAGE plpgsql;

-- ── Helper fn: is_circuit_open ────────────────────────────────────────────
-- Returns TRUE if the breaker is open AND cool-down hasn't elapsed.
-- After cool-down, moves to 'half_open' so one probe call can retry.
CREATE OR REPLACE FUNCTION engine_is_circuit_open(
  p_api              TEXT,
  p_cooldown_seconds INTEGER DEFAULT 300  -- 5 min default
) RETURNS BOOLEAN AS $$
DECLARE
  v_row engine_api_circuits%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM engine_api_circuits WHERE api = p_api;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF v_row.state = 'closed' THEN RETURN FALSE; END IF;

  -- Cool-down elapsed? → move to half_open (allow one probe)
  IF v_row.opened_at IS NOT NULL
     AND NOW() - v_row.opened_at > (p_cooldown_seconds || ' seconds')::INTERVAL THEN
    UPDATE engine_api_circuits
       SET state = 'half_open'
     WHERE api = p_api AND state = 'open';
    RETURN FALSE;
  END IF;

  RETURN v_row.state = 'open';
END;
$$ LANGUAGE plpgsql;

-- ── View: active run (handy for debugging) ────────────────────────────────
CREATE OR REPLACE VIEW engine_autopilot_active_run AS
SELECT r.*,
       COALESCE((
         SELECT COUNT(*)::INTEGER FROM engine_autopilot_ticks t WHERE t.run_id = r.id
       ), 0) AS actual_tick_count
  FROM engine_autopilot_runs r
 WHERE r.status IN ('running','paused')
 ORDER BY r.created_at DESC
 LIMIT 1;

COMMENT ON TABLE engine_autopilot_runs  IS 'One row per AutoPilot run. Survives browser close. Immutable config + live counters.';
COMMENT ON TABLE engine_autopilot_ticks IS 'Append-only tick log. Joined to runs for history page.';
COMMENT ON TABLE engine_api_circuits    IS 'Circuit breaker state per external API. Prevents infinite burn when an upstream is down.';

// ═══════════════════════════════════════════════════════════════════════════
// AutoPilot shared types + helpers. Server + client both import from here.
// ═══════════════════════════════════════════════════════════════════════════

export const AUTOPILOT_DEFAULT_BATCH        = 10;
export const AUTOPILOT_DEFAULT_MAX_TICKS    = 100;
export const AUTOPILOT_DELAY_BETWEEN_MS     = 1_500;
export const AUTOPILOT_TICK_MAX_RETRIES     = 3;
export const AUTOPILOT_RETRY_BACKOFF_BASE_MS = 2_000;
export const AUTOPILOT_POLL_INTERVAL_MS     = 2_000;

export const CIRCUIT_FAILURE_THRESHOLD      = 5;
export const CIRCUIT_COOLDOWN_SECONDS       = 300;

export type AutopilotStatus =
  | "running" | "paused" | "completed" | "cancelled" | "failed";

export type AutopilotStage = "analyze" | "find-dm";

export type AutopilotRun = {
  id:              string;
  status:          AutopilotStatus;

  stages:          AutopilotStage[];
  batch_size:      number;
  max_ticks:       number;
  max_cost_usd:    number | null;

  ticks_completed: number;
  processed:       number;
  analyzed:        number;
  dms_found:       number;
  failures:        number;
  cost_usd:        number;

  paused_at:       string | null;

  finished_at:     string | null;
  finish_reason:   string | null;
  last_error:      string | null;

  triggered_by:    string;
  created_at:      string;
  updated_at:      string;
};

export type AutopilotTick = {
  id:          number;
  run_id:      string;
  seq:         number;
  stage:       string;
  status:      "ok" | "retry" | "fail" | "budget" | "done" | "circuit_open" | "cost_cap";
  message:     string;
  processed:   number;
  successes:   number;
  failures:    number;
  cost_usd:    number;
  duration_ms: number | null;
  retry_num:   number | null;
  error_code:  string | null;
  at:          string;
};

export type ApiCircuit = {
  api:               string;
  state:             "closed" | "open" | "half_open";
  consecutive_fails: number;
  opened_at:         string | null;
  last_error:        string | null;
  updated_at:        string;
};

export function isTerminal(status: AutopilotStatus): boolean {
  return status === "completed" || status === "cancelled" || status === "failed";
}

export function isActive(status: AutopilotStatus): boolean {
  return status === "running" || status === "paused";
}

// ═══════════════════════════════════════════════════════════════════════════
// Engine API Guard — centralized budget + rate limit + logging helper.
// Every enrichment call should go through `callApi(...)` for:
//   • Pre-flight budget check (per-day $ cap)
//   • Pre-flight call cap check (per-day call count)
//   • Post-flight usage logging (cost, latency, success/fail)
//   • Circuit breaker (auto-pause API after N consecutive failures)
// ═══════════════════════════════════════════════════════════════════════════

import { getEngineAdmin } from "@/lib/engineSupabase";

export type EngineApi = "apify" | "openai" | "apollo" | "linkedin";

export class BudgetExceededError extends Error {
  constructor(public api: EngineApi, public reason: string) {
    super(`Budget exceeded for ${api}: ${reason}`);
    this.name = "BudgetExceededError";
  }
}

export class ApiPausedError extends Error {
  constructor(public api: EngineApi, public reason: string) {
    super(`API ${api} is paused: ${reason}`);
    this.name = "ApiPausedError";
  }
}

type BudgetCheck = {
  ok: boolean;
  reason?: string;
  spent_today_usd?: number;
  calls_today?: number;
  cap_usd?: number;
  cap_calls?: number;
};

/** Check if we're allowed to call this API right now. */
export async function checkBudget(api: EngineApi): Promise<BudgetCheck> {
  const db = getEngineAdmin();

  // Fetch budget config
  const { data: budget } = await db
    .from("engine_api_budgets")
    .select("daily_cap_usd, daily_call_cap, is_paused, pause_reason")
    .eq("api", api)
    .maybeSingle();

  if (!budget) {
    // No budget row = treat as unlimited (but log a warning)
    console.warn(`[engineApiGuard] No budget config for API: ${api}`);
    return { ok: true };
  }

  if (budget.is_paused) {
    return { ok: false, reason: `API paused: ${budget.pause_reason ?? "manual"}` };
  }

  // Fetch today's spend
  const { data: spend } = await db
    .from("engine_api_spend_today")
    .select("total_cost_usd, call_count")
    .eq("api", api)
    .maybeSingle();

  const spent = Number(spend?.total_cost_usd ?? 0);
  const calls = Number(spend?.call_count ?? 0);

  if (spent >= Number(budget.daily_cap_usd)) {
    return {
      ok: false,
      reason: `Daily $ cap hit (${spent.toFixed(2)}/${budget.daily_cap_usd})`,
      spent_today_usd: spent,
      cap_usd: Number(budget.daily_cap_usd),
    };
  }

  if (calls >= Number(budget.daily_call_cap)) {
    return {
      ok: false,
      reason: `Daily call cap hit (${calls}/${budget.daily_call_cap})`,
      calls_today: calls,
      cap_calls: Number(budget.daily_call_cap),
    };
  }

  return {
    ok: true,
    spent_today_usd: spent,
    calls_today: calls,
    cap_usd: Number(budget.daily_cap_usd),
    cap_calls: Number(budget.daily_call_cap),
  };
}

/** Log an API call to engine_api_usage (fire-and-forget; failure to log should not break the flow). */
export async function logApiCall(params: {
  api: EngineApi;
  operation: string;
  job_id?: string | null;
  cost_usd?: number;
  latency_ms: number;
  success: boolean;
  status_code?: number | null;
  error_msg?: string | null;
}): Promise<void> {
  try {
    const db = getEngineAdmin();
    await db.from("engine_api_usage").insert({
      api:         params.api,
      operation:   params.operation,
      job_id:      params.job_id ?? null,
      cost_usd:    params.cost_usd ?? 0,
      latency_ms:  params.latency_ms,
      success:     params.success,
      status_code: params.status_code ?? null,
      error_msg:   params.error_msg ?? null,
    });
  } catch (e) {
    console.error("[engineApiGuard] Failed to log API call:", e);
  }
}

/** Auto-pause an API after N consecutive failures in the last window. */
export async function circuitBreakerCheck(
  api: EngineApi,
  consecutiveFailThreshold = 10,
): Promise<void> {
  const db = getEngineAdmin();
  // Look at the last 20 calls for this API
  const { data: recent } = await db
    .from("engine_api_usage")
    .select("success")
    .eq("api", api)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!recent || recent.length < consecutiveFailThreshold) return;

  // Count consecutive failures from most recent
  let consecutiveFails = 0;
  for (const row of recent) {
    if (row.success) break;
    consecutiveFails++;
  }

  if (consecutiveFails >= consecutiveFailThreshold) {
    console.error(`[engineApiGuard] Circuit breaker: auto-pausing ${api} after ${consecutiveFails} consecutive failures`);
    await db
      .from("engine_api_budgets")
      .update({
        is_paused: true,
        pause_reason: `Auto-paused: ${consecutiveFails} consecutive failures`,
        updated_at: new Date().toISOString(),
      })
      .eq("api", api);
  }
}

/** Wrap an API call with pre-flight budget check + post-flight logging + circuit breaker. */
export async function callApi<T>(
  params: {
    api: EngineApi;
    operation: string;
    job_id?: string | null;
    estimated_cost_usd?: number;
  },
  fn: () => Promise<{ result: T; cost_usd: number; status_code?: number }>,
): Promise<T> {
  // 1. Pre-flight: budget check
  const check = await checkBudget(params.api);
  if (!check.ok) {
    throw new BudgetExceededError(params.api, check.reason ?? "unknown");
  }

  // 2. Execute + measure
  const start = Date.now();
  try {
    const { result, cost_usd, status_code } = await fn();
    const latency_ms = Date.now() - start;

    await logApiCall({
      api:        params.api,
      operation:  params.operation,
      job_id:     params.job_id,
      cost_usd,
      latency_ms,
      success:    true,
      status_code: status_code ?? 200,
    });

    return result;
  } catch (err: unknown) {
    const latency_ms = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);

    await logApiCall({
      api:        params.api,
      operation:  params.operation,
      job_id:     params.job_id,
      cost_usd:   0,
      latency_ms,
      success:    false,
      error_msg:  msg,
    });

    // Fire circuit breaker check (async, don't block)
    circuitBreakerCheck(params.api).catch(() => {});

    throw err;
  }
}

/** Record a stage transition in the audit log. */
export async function logStageTransition(params: {
  job_id: string;
  from_stage: string;
  to_stage: string;
  success: boolean;
  reason?: string | null;
  cost_usd?: number;
  duration_ms?: number;
  error_msg?: string | null;
}): Promise<void> {
  try {
    const db = getEngineAdmin();
    await db.from("engine_stage_transitions").insert({
      job_id:      params.job_id,
      from_stage:  params.from_stage,
      to_stage:    params.to_stage,
      reason:      params.reason ?? null,
      cost_usd:    params.cost_usd ?? 0,
      duration_ms: params.duration_ms ?? null,
      success:     params.success,
      error_msg:   params.error_msg ?? null,
    });
  } catch (e) {
    console.error("[engineApiGuard] Failed to log stage transition:", e);
  }
}

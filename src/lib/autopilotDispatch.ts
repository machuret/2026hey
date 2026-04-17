// ═══════════════════════════════════════════════════════════════════════════
// AutoPilot tick dispatcher — server-side. Thin wrapper around the existing
// /api/engine/jobs/tick handler that additionally:
//   1. Claims work for the specified stages only
//   2. Honours the run's cost cap
//   3. Honours per-API circuit breakers
//   4. Persists a row in engine_autopilot_ticks
//   5. Updates live counters on engine_autopilot_runs
//
// Called from:
//   - Client polling loop (lightweight — just triggers this, then polls state)
//   - Server-side pg_cron (unattended runs)
// ═══════════════════════════════════════════════════════════════════════════

import { getEngineAdmin } from "@/lib/engineSupabase";
import { checkBudget, BudgetExceededError } from "@/lib/engineApiGuard";
import {
  trimForEnrich,
  callEnrichEdgeFn,
  applyEnrichmentsBatch,
  releaseClaimLocks,
  TransientApiError,
} from "@/lib/engineEnrichHelpers";
import {
  CIRCUIT_FAILURE_THRESHOLD,
  CIRCUIT_COOLDOWN_SECONDS,
  type AutopilotRun,
  type AutopilotStage,
} from "@/lib/autopilot";
import { extractErrorMsg } from "@/app/engine/jobs/utils";
import type { NextRequest } from "next/server";

type Db = ReturnType<typeof getEngineAdmin>;

export type DispatchOutcome =
  | { kind: "ok";           stage: string; processed: number; successes: number; failures: number; costUsd: number; dm_found?: number; dm_not_found?: number }
  | { kind: "done"          }
  | { kind: "budget";       api: string; reason: string }
  | { kind: "circuit_open"; api: string }
  | { kind: "cost_cap";     cap: number;   spent: number }
  | { kind: "error";        message: string; transient: boolean };

export type DispatchInput = {
  run:     AutopilotRun;
  req:     NextRequest;
  db:      Db;
};

async function claim(
  db: Db,
  rpc: "engine_claim_jobs_for_analyze" | "engine_claim_jobs_for_dm",
  n:   number,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await db.rpc(rpc, { batch_size: n });
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

async function isCircuitOpen(db: Db, api: string): Promise<boolean> {
  const { data, error } = await db.rpc("engine_is_circuit_open", {
    p_api: api,
    p_cooldown_seconds: CIRCUIT_COOLDOWN_SECONDS,
  });
  if (error) { console.error("[autopilot] circuit check failed:", error); return false; }
  return Boolean(data);
}

async function recordCircuitResult(
  db: Db, api: string, success: boolean, err: string | null,
): Promise<void> {
  const { error } = await db.rpc("engine_record_circuit_result", {
    p_api: api,
    p_success: success,
    p_threshold: CIRCUIT_FAILURE_THRESHOLD,
    p_error: err,
  });
  if (error) console.error("[autopilot] circuit record failed:", error);
}

/**
 * Execute ONE tick for a run.
 * Returns an outcome; caller persists it + updates run counters.
 */
export async function dispatchOneTick({ run, req, db }: DispatchInput): Promise<DispatchOutcome> {
  // ── Cost cap check (before any spend) ────────────────────────────────────
  if (run.max_cost_usd != null && run.cost_usd >= run.max_cost_usd) {
    return { kind: "cost_cap", cap: Number(run.max_cost_usd), spent: Number(run.cost_usd) };
  }

  const stages = run.stages as AutopilotStage[];

  // ── Try analyze stage ────────────────────────────────────────────────────
  if (stages.includes("analyze")) {
    if (await isCircuitOpen(db, "openai")) {
      return { kind: "circuit_open", api: "openai" };
    }
    const budget = await checkBudget("openai");
    if (!budget.ok) {
      return { kind: "budget", api: "openai", reason: budget.reason ?? "budget exceeded" };
    }
    const jobs = await claim(db, "engine_claim_jobs_for_analyze", run.batch_size);
    if (jobs.length > 0) {
      return runBatch(db, req, jobs, "analyze", "ai", "openai");
    }
  }

  // ── Try find-dm stage ────────────────────────────────────────────────────
  if (stages.includes("find-dm")) {
    if (await isCircuitOpen(db, "apollo")) {
      return { kind: "circuit_open", api: "apollo" };
    }
    const budget = await checkBudget("apollo");
    if (!budget.ok) {
      return { kind: "budget", api: "apollo", reason: budget.reason ?? "budget exceeded" };
    }
    const dmBatch = Math.min(run.batch_size, 10);
    const jobs = await claim(db, "engine_claim_jobs_for_dm", dmBatch);
    if (jobs.length > 0) {
      return runBatch(db, req, jobs, "find-dm", "apollo", "apollo");
    }
  }

  return { kind: "done" };
}

async function runBatch(
  db: Db,
  req: NextRequest,
  jobs: Record<string, unknown>[],
  stage: "analyze" | "find-dm",
  method: "ai" | "apollo",
  api:    "openai" | "apollo",
): Promise<DispatchOutcome> {
  const claimedIds = jobs.map((j) => String(j.id));
  const start = Date.now();

  try {
    const { enrichments, costUsd } = await callEnrichEdgeFn({
      method, jobs: jobs.map(trimForEnrich), req, api,
    });
    const durationMs = Date.now() - start;

    let realEnrichments = enrichments;
    if (method === "apollo") {
      realEnrichments = {};
      for (const [id, fields] of Object.entries(enrichments)) {
        if (fields.dm_name && (fields.dm_email || fields.dm_linkedin_url)) {
          realEnrichments[id] = fields;
        }
      }
    }

    const summary = await applyEnrichmentsBatch({
      method, originalJobs: jobs, enrichments: realEnrichments, costUsd, durationMs,
    });

    await recordCircuitResult(db, api, true, null);

    // For find-dm stage, success == DM found (that's the definition filter above).
    const dm_found     = stage === "find-dm" ? summary.successes : undefined;
    const dm_not_found = stage === "find-dm" ? jobs.length - summary.successes : undefined;

    return {
      kind: "ok",
      stage,
      processed: jobs.length,
      successes: summary.successes,
      failures:  summary.failures,
      costUsd,
      dm_found,
      dm_not_found,
    };
  } catch (err) {
    const transient = err instanceof TransientApiError;
    const msg = extractErrorMsg(err);
    await recordCircuitResult(db, api, false, msg);
    if (transient) {
      await releaseClaimLocks(claimedIds).catch(() => {});
      return { kind: "error", message: msg, transient: true };
    }
    await releaseClaimLocks(claimedIds).catch(() => {});
    if (err instanceof BudgetExceededError) {
      return { kind: "budget", api, reason: msg };
    }
    return { kind: "error", message: msg, transient: false };
  }
}

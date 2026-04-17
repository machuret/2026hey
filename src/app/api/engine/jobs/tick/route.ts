import { NextRequest, NextResponse } from "next/server";
import { requireEngineAuth } from "@/lib/engineAuth";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { extractErrorMsg } from "@/app/engine/jobs/utils";
import { checkBudget, BudgetExceededError } from "@/lib/engineApiGuard";
import {
  trimForEnrich,
  callEnrichEdgeFn,
  applyEnrichmentsBatch,
  releaseClaimLocks,
  TransientApiError,
} from "@/lib/engineEnrichHelpers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/engine/jobs/tick
 *
 * The automation worker. Processes ONE batch of ONE stage per invocation.
 * Call this on a cron or in a loop to automate the pipeline end-to-end.
 *
 * Priority order (first stage with eligible work wins):
 *   1. Pending → AI analyze (up to 20 jobs)
 *   2. Qualified → DM search (up to 10 jobs)
 *
 * Safety:
 *   - Checks budget BEFORE fetching jobs (short-circuits if any API is capped)
 *   - Never retries a job too soon (respects next_retry_at)
 *   - Max attempts guards prevent infinite loops
 *   - Returns { done: true } when nothing to do (caller stops looping)
 *
 * Request body (optional):
 *   { stage?: "analyze" | "find-dm", batchSize?: number }
 *   If stage omitted, picks highest-priority stage with work.
 */
export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => ({}));
    const requestedStage: string | undefined = body.stage;
    const batchSize: number = Math.min(Math.max(Number(body.batchSize) || 20, 1), 50);

    const db = getEngineAdmin();

    // ── Atomic claim via RPC (race-safe across concurrent workers) ─────────
    async function claim(rpc: "engine_claim_jobs_for_analyze" | "engine_claim_jobs_for_dm", n: number) {
      const { data, error } = await db.rpc(rpc, { batch_size: n });
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    }

    // ── Decide which stage to run ──────────────────────────────────────────
    let stage = requestedStage;
    let jobs: Record<string, unknown>[] = [];
    let api: "openai" | "apollo" = "openai";
    let method: "ai" | "apollo" = "ai";

    if (!stage || stage === "analyze") {
      const aiBudget = await checkBudget("openai");
      if (aiBudget.ok) {
        jobs = await claim("engine_claim_jobs_for_analyze", batchSize);
        if (jobs.length > 0) {
          stage = "analyze"; api = "openai"; method = "ai";
        }
      } else if (stage === "analyze") {
        return NextResponse.json({
          success: false, stage: "analyze", code: "BUDGET_EXCEEDED", reason: aiBudget.reason,
        }, { status: 429 });
      }
    }

    if (jobs.length === 0 && (!requestedStage || requestedStage === "find-dm")) {
      const dmBudget = await checkBudget("apollo");
      if (dmBudget.ok) {
        jobs = await claim("engine_claim_jobs_for_dm", Math.min(batchSize, 10));
        if (jobs.length > 0) {
          stage = "find-dm"; api = "apollo"; method = "apollo";
        }
      } else if (stage === "find-dm") {
        return NextResponse.json({
          success: false, stage: "find-dm", code: "BUDGET_EXCEEDED", reason: dmBudget.reason,
        }, { status: 429 });
      }
    }

    if (jobs.length === 0) {
      return NextResponse.json({ success: true, done: true, message: "No eligible jobs in any stage" });
    }

    // ── Run the stage ──────────────────────────────────────────────────────
    const claimedIds = jobs.map((j) => String(j.id));
    const start = Date.now();

    try {
      const { enrichments, costUsd } = await callEnrichEdgeFn({
        method, jobs: jobs.map(trimForEnrich), req, api,
      });
      const durationMs = Date.now() - start;

      // For DM stage, only non-empty enrichments with actual contact info count as successes.
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

      return NextResponse.json({
        success: true, done: false, stage, processed: jobs.length, costUsd, ...summary,
      });
    } catch (err) {
      // Transient infra error: release the claim lock so jobs retry next tick
      // WITHOUT incrementing their attempt counter. This is the whole point of
      // distinguishing infra failures from "no results found".
      if (err instanceof TransientApiError) {
        await releaseClaimLocks(claimedIds).catch(() => {});
        return NextResponse.json({
          success: false,
          code: "TRANSIENT_API_ERROR",
          api: err.api,
          reason: err.message,
          released: claimedIds.length,
        }, { status: 503 });
      }
      // Other errors: also release locks so jobs aren't stuck for 10 min.
      await releaseClaimLocks(claimedIds).catch(() => {});
      throw err;
    }
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json({
        success: false, code: "BUDGET_EXCEEDED", api: err.api, reason: err.message,
      }, { status: 429 });
    }
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

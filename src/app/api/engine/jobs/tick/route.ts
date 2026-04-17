import { NextRequest, NextResponse } from "next/server";
import { requireEngineAuth } from "@/lib/engineAuth";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { extractErrorMsg } from "@/app/engine/jobs/utils";
import { checkBudget, BudgetExceededError } from "@/lib/engineApiGuard";
import {
  fetchJobsByIds,
  trimForEnrich,
  callEnrichEdgeFn,
  applyEnrichmentsBatch,
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
    const now = new Date().toISOString();

    // ── Helper: find pending jobs (new, not ai-analyzed, not recently tried) ──
    async function findPendingJobs(n: number): Promise<Record<string, unknown>[]> {
      const { data, error } = await db
        .from("job_leads")
        .select("*")
        .is("ai_enriched_at", null)
        .lt("ai_attempts", 2)
        .not("status", "in", "(pushed_to_crm,dismissed,recruiter_dismissed)")
        .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
        .order("created_at", { ascending: true })
        .limit(n);
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    }

    // ── Helper: find qualified jobs (AI done, relevant, no DM yet) ──────────
    async function findQualifiedJobs(n: number): Promise<Record<string, unknown>[]> {
      const { data, error } = await db
        .from("job_leads")
        .select("*")
        .not("ai_enriched_at", "is", null)
        .gte("ai_relevance_score", 6)
        .eq("ai_poster_type", "internal")
        .is("dm_name", null)
        .lt("dm_attempts", 3)
        .not("status", "in", "(pushed_to_crm,dismissed,recruiter_dismissed)")
        .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
        .order("ai_enriched_at", { ascending: true })
        .limit(n);
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    }

    // ── Decide which stage to run ──────────────────────────────────────────
    let stage = requestedStage;
    let jobs: Record<string, unknown>[] = [];
    let api: "openai" | "apollo" = "openai";
    let method: "ai" | "apollo" = "ai";

    if (!stage || stage === "analyze") {
      // Check budget before fetching
      const aiBudget = await checkBudget("openai");
      if (aiBudget.ok) {
        jobs = await findPendingJobs(batchSize);
        if (jobs.length > 0) {
          stage = "analyze";
          api = "openai";
          method = "ai";
        }
      } else if (stage === "analyze") {
        return NextResponse.json({
          success: false,
          stage: "analyze",
          code: "BUDGET_EXCEEDED",
          reason: aiBudget.reason,
        }, { status: 429 });
      }
    }

    if (jobs.length === 0 && (!requestedStage || requestedStage === "find-dm")) {
      const dmBudget = await checkBudget("apollo");
      if (dmBudget.ok) {
        jobs = await findQualifiedJobs(Math.min(batchSize, 10));
        if (jobs.length > 0) {
          stage = "find-dm";
          api = "apollo";
          method = "apollo";
        }
      } else if (stage === "find-dm") {
        return NextResponse.json({
          success: false,
          stage: "find-dm",
          code: "BUDGET_EXCEEDED",
          reason: dmBudget.reason,
        }, { status: 429 });
      }
    }

    // Nothing to do anywhere
    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        done: true,
        message: "No eligible jobs in any stage",
      });
    }

    // ── Run the stage ──────────────────────────────────────────────────────
    const ids = jobs.map((j) => String(j.id));
    const fullJobs = await fetchJobsByIds(ids);

    const start = Date.now();
    const { enrichments, costUsd } = await callEnrichEdgeFn({
      method,
      jobs: fullJobs.map(trimForEnrich),
      req,
      api,
    });
    const durationMs = Date.now() - start;

    // For DM stage, filter out empty enrichments (they count as failures)
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
      method,
      originalJobs: fullJobs,
      enrichments: realEnrichments,
      costUsd,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      done: false,
      stage,
      processed: fullJobs.length,
      costUsd,
      ...summary,
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json({
        success: false,
        code: "BUDGET_EXCEEDED",
        api: err.api,
        reason: err.message,
      }, { status: 429 });
    }
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

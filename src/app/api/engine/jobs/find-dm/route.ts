import { NextRequest, NextResponse } from "next/server";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";
import { BudgetExceededError } from "@/lib/engineApiGuard";
import {
  fetchJobsByIds,
  trimForEnrich,
  callEnrichEdgeFn,
  applyEnrichmentsBatch,
  TransientApiError,
} from "@/lib/engineEnrichHelpers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/engine/jobs/find-dm
 * Stage transition: qualified → enriched | stuck_no_dm
 * Runs Apollo DM finder. If Apollo returns nothing, increments dm_attempts
 * and sets dm_failure_reason. After 3 attempts, the job enters stuck_no_dm.
 *
 * STRICT STAGE GATE: jobs that don't get a DM cannot progress to the next stage.
 * They remain in `qualified` (retryable) or `stuck_no_dm` (exhausted).
 */
export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.jobIds) ? body.jobIds : [];
    if (!ids.length) return NextResponse.json({ error: "jobIds array required" }, { status: 400 });
    if (ids.length > 50) return NextResponse.json({ error: "Max 50 jobs per batch" }, { status: 400 });

    const jobs = await fetchJobsByIds(ids);
    if (!jobs.length) return NextResponse.json({ error: "No jobs found" }, { status: 404 });

    // Sanity: only process jobs that are AI-enriched + qualified
    // (Prevents accidental calls on raw/unqualified jobs, protects budget)
    const eligible = jobs.filter((j) =>
      j.ai_enriched_at != null &&
      Number(j.ai_relevance_score ?? 0) >= 6 &&
      j.ai_poster_type === "internal" &&
      !j.dm_name &&
      Number(j.dm_attempts ?? 0) < 3,
    );

    if (!eligible.length) {
      return NextResponse.json({
        success: true,
        stage: "find-dm",
        requested: ids.length,
        processed: 0,
        skipped: jobs.length,
        skipReason: "No eligible jobs (must be qualified + <3 attempts + no DM yet)",
      });
    }

    const start = Date.now();
    const { enrichments, costUsd } = await callEnrichEdgeFn({
      method: "apollo",
      jobs: eligible.map(trimForEnrich),
      req,
      api: "apollo",
    });
    const durationMs = Date.now() - start;

    // Filter out "enrichments" that are actually empty (no dm_name) — those are failures
    const realEnrichments: typeof enrichments = {};
    for (const [id, fields] of Object.entries(enrichments)) {
      if (fields.dm_name && (fields.dm_email || fields.dm_linkedin_url)) {
        realEnrichments[id] = fields;
      }
      // else: don't include → applyEnrichmentsBatch will treat as failure → dm_attempts++
    }

    const summary = await applyEnrichmentsBatch({
      method: "apollo",
      originalJobs: eligible,
      enrichments: realEnrichments,
      costUsd,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      stage: "find-dm",
      requested: ids.length,
      processed: eligible.length,
      skipped: jobs.length - eligible.length,
      costUsd,
      dm_found: summary.successes,
      dm_not_found: summary.failures,
      transitions: summary.transitions,
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json({ error: err.message, code: "BUDGET_EXCEEDED", api: err.api }, { status: 429 });
    }
    if (err instanceof TransientApiError) {
      return NextResponse.json({ error: err.message, code: "TRANSIENT_API_ERROR", api: err.api, retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

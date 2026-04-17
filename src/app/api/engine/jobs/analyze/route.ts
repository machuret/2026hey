import { NextRequest, NextResponse } from "next/server";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";
import { BudgetExceededError } from "@/lib/engineApiGuard";
import {
  fetchJobsByIds,
  trimForEnrich,
  callEnrichEdgeFn,
  applyEnrichmentsBatch,
} from "@/lib/engineEnrichHelpers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/engine/jobs/analyze
 * Stage transition: pending → qualified | dead_end
 * Runs OpenAI analysis on the given job IDs.
 * Applies budget guards + attempt counters + audit logging.
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
    if (!jobs.length) return NextResponse.json({ error: "No jobs found for given IDs" }, { status: 404 });

    const start = Date.now();
    const { enrichments, costUsd } = await callEnrichEdgeFn({
      method: "ai",
      jobs: jobs.map(trimForEnrich),
      req,
      api: "openai",
    });
    const durationMs = Date.now() - start;

    const summary = await applyEnrichmentsBatch({
      method: "ai",
      originalJobs: jobs,
      enrichments,
      costUsd,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      stage: "analyze",
      requested: ids.length,
      processed: jobs.length,
      costUsd,
      ...summary,
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json({ error: err.message, code: "BUDGET_EXCEEDED", api: err.api }, { status: 429 });
    }
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

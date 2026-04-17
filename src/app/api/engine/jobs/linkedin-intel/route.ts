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
 * POST /api/engine/jobs/linkedin-intel
 * Optional enrichment: adds LinkedIn company profile data.
 * Does NOT gate pipeline progression (jobs can reach Enriched without it).
 * Runs on any job that has a company_name.
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

    const eligible = jobs.filter((j) => j.company_name && Number(j.li_attempts ?? 0) < 3);

    if (!eligible.length) {
      return NextResponse.json({
        success: true,
        stage: "linkedin-intel",
        requested: ids.length,
        processed: 0,
        skipped: jobs.length,
      });
    }

    const start = Date.now();
    const { enrichments, costUsd } = await callEnrichEdgeFn({
      method: "linkedin",
      jobs: eligible.map(trimForEnrich),
      req,
      api: "linkedin",
    });
    const durationMs = Date.now() - start;

    const summary = await applyEnrichmentsBatch({
      method: "linkedin",
      originalJobs: eligible,
      enrichments,
      costUsd,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      stage: "linkedin-intel",
      requested: ids.length,
      processed: eligible.length,
      skipped: jobs.length - eligible.length,
      costUsd,
      ...summary,
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

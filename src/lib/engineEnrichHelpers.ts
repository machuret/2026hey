// ═══════════════════════════════════════════════════════════════════════════
// Shared helpers for per-stage enrichment API routes (analyze, find-dm,
// linkedin-intel). Centralizes DB writes, attempt counters, failure logging,
// and stage transition audit.
// ═══════════════════════════════════════════════════════════════════════════

import { getEngineAdmin, proxyEdgeFn } from "@/lib/engineSupabase";
import { checkBudget, logStageTransition, BudgetExceededError } from "@/lib/engineApiGuard";
import { computeStage } from "@/lib/pipelineStage";
import type { NextRequest } from "next/server";

export type EnrichMethod = "ai" | "apollo" | "linkedin";

/**
 * Trim a JobLead to the minimal shape the edge function needs.
 * Also strips the description to 5K chars for cost control.
 */
export function trimForEnrich(j: Record<string, unknown>) {
  return {
    id: j.id,
    company_name: j.company_name,
    company_website: j.company_website,
    company_industry: j.company_industry,
    company_size: j.company_size,
    description: j.description ? String(j.description).slice(0, 5000) : null,
    job_title: j.job_title,
    location: j.location,
    country: j.country,
    salary: j.salary,
    work_type: j.work_type,
    work_arrangement: j.work_arrangement,
    emails: Array.isArray(j.emails) ? j.emails : [],
    phone_numbers: Array.isArray(j.phone_numbers) ? j.phone_numbers : [],
    recruiter_name: j.recruiter_name,
    recruiter_agency: j.recruiter_agency,
    recruiter_website: j.recruiter_website,
    listed_at: j.listed_at,
  };
}

/** Fetch jobs by ID from the DB, returning only the minimal shape. */
export async function fetchJobsByIds(ids: string[]): Promise<Record<string, unknown>[]> {
  if (!ids.length) return [];
  const db = getEngineAdmin();
  const { data, error } = await db
    .from("job_leads")
    .select("*")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

/**
 * Call the edge function for a single enrichment method with budget guard.
 * Returns enrichments map { [jobId]: { field: value } } + cost.
 */
export async function callEnrichEdgeFn(params: {
  method: EnrichMethod;
  jobs: ReturnType<typeof trimForEnrich>[];
  req: NextRequest;
  api: "openai" | "apollo" | "linkedin";
}): Promise<{ enrichments: Record<string, Record<string, unknown>>; costUsd: number }> {
  // Pre-flight: budget check
  const budget = await checkBudget(params.api);
  if (!budget.ok) {
    throw new BudgetExceededError(params.api, budget.reason ?? "unknown");
  }

  const res = await proxyEdgeFn(
    "engine-jobs-enrich",
    "POST",
    params.req,
    {},
    { jobs: params.jobs, method: params.method },
    290_000,
  );

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error ?? "Edge function returned unsuccessful");
  }

  return {
    enrichments: (data.enrichments ?? {}) as Record<string, Record<string, unknown>>,
    costUsd: Number(data.costUsd ?? 0),
  };
}

/**
 * Persist enrichment results for a single job + update attempt counters +
 * log stage transition. This is the critical automation-safe write.
 *
 * For each job:
 *   - If enriched: write fields, increment success counter, clear failure reason
 *   - If not enriched: increment attempt counter, set failure reason, log failure
 *   - Always: log stage transition audit row
 */
export async function applyEnrichmentsBatch(params: {
  method: EnrichMethod;
  originalJobs: Record<string, unknown>[];     // full jobs before enrichment (for stage calc)
  enrichments: Record<string, Record<string, unknown>>;
  costUsd: number;
  durationMs: number;
}): Promise<{ successes: number; failures: number; transitions: number }> {
  const db = getEngineAdmin();
  const attemptField =
    params.method === "ai" ? "ai_attempts" :
    params.method === "apollo" ? "dm_attempts" :
    "li_attempts";
  const failureField =
    params.method === "ai" ? "ai_failure_reason" :
    params.method === "apollo" ? "dm_failure_reason" :
    "li_failure_reason";

  let successes = 0;
  let failures  = 0;
  let transitions = 0;

  // Amortize cost across jobs for per-job tracking
  const perJobCost = params.originalJobs.length > 0
    ? params.costUsd / params.originalJobs.length
    : 0;

  for (const job of params.originalJobs) {
    const jobId = String(job.id);
    const fromStage = computeStage(job as Parameters<typeof computeStage>[0]);
    const enrichment = params.enrichments[jobId];

    // Build the UPDATE patch
    const patch: Record<string, unknown> = {
      [attemptField]: Number(job[attemptField] ?? 0) + 1,
      total_cost_usd: Number(job.total_cost_usd ?? 0) + perJobCost,
      updated_at: new Date().toISOString(),
    };

    if (enrichment && Object.keys(enrichment).length > 0) {
      // SUCCESS: write enrichment fields, clear failure reason
      Object.assign(patch, enrichment);
      patch[failureField] = null;
      patch.last_error = null;

      // Status transition
      if (params.method === "ai") {
        patch.status = job.status === "new" ? "ai_enriched" : job.status;
        // Auto-dismiss agency posts
        if (enrichment.ai_poster_type === "agency_recruiter") {
          patch.status = "recruiter_dismissed";
        }
      } else if (params.method === "apollo" && enrichment.dm_name) {
        patch.status = job.status === "ai_enriched" ? "dm_enriched" : job.status;
      }

      successes++;
    } else {
      // FAILURE: record reason
      patch[failureField] = `${params.method} returned no data`;
      patch.last_error = `${params.method}: no enrichment returned`;
      failures++;
    }

    // Apply the patch
    const { error: updateErr } = await db
      .from("job_leads")
      .update(patch)
      .eq("id", jobId);

    if (updateErr) {
      console.error(`[enrichHelpers] Failed to update job ${jobId}:`, updateErr);
      failures++;
      continue;
    }

    // Log stage transition (don't await — fire and forget)
    const updatedJob = { ...job, ...patch };
    const toStage = computeStage(updatedJob as Parameters<typeof computeStage>[0]);
    if (toStage !== fromStage) {
      logStageTransition({
        job_id: jobId,
        from_stage: fromStage,
        to_stage: toStage,
        success: !!enrichment,
        reason: `${params.method} enrichment`,
        cost_usd: perJobCost,
        duration_ms: Math.round(params.durationMs / params.originalJobs.length),
        error_msg: enrichment ? null : `No ${params.method} result`,
      }).catch(() => {});
      transitions++;
    }
  }

  return { successes, failures, transitions };
}

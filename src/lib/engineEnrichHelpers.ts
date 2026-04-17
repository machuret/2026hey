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

/** Thrown when the underlying API (Apify/OpenAI) was unreachable — caller
 *  should NOT increment attempt counters, since it's a transient outage.
 *  The tick worker's claim lock will expire after 10 min and retry. */
export class TransientApiError extends Error {
  constructor(msg: string, public api: string) {
    super(msg);
    this.name = "TransientApiError";
  }
}

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

  // Transient infra failure — caller must not increment attempts
  if (data.code === "APIFY_INFRA_ERROR" || (res.status === 502 && data.retryable)) {
    throw new TransientApiError(data.error ?? "Apify unreachable", params.api);
  }

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

  // Count successful enrichments up-front so we can attribute cost correctly.
  // A "success" is a non-empty enrichment object for that job.
  const successIds = new Set<string>();
  for (const [id, fields] of Object.entries(params.enrichments)) {
    if (fields && Object.keys(fields).length > 0) successIds.add(id);
  }

  // Cost attribution:
  //   - If there are successes: spread cost over successful jobs only
  //     (more accurate — failed jobs don't "earn" their share of spend)
  //   - Else: spread evenly across all attempted jobs (we still spent money)
  const costBase = successIds.size > 0 ? successIds.size : params.originalJobs.length;
  const perJobCost = costBase > 0 ? params.costUsd / costBase : 0;
  const perJobDurationMs = params.originalJobs.length > 0
    ? Math.round(params.durationMs / params.originalJobs.length)
    : params.durationMs;

  const now = new Date().toISOString();

  // Build + dispatch all UPDATEs in parallel. Each returns { jobId, ok, fromStage, toStage, isSuccess }
  const results = await Promise.all(params.originalJobs.map(async (job) => {
    const jobId = String(job.id);
    const fromStage = computeStage(job as Parameters<typeof computeStage>[0]);
    const enrichment = params.enrichments[jobId];
    const isSuccess = successIds.has(jobId);

    // Always: increment attempts, add cost, release the claim lock, stamp updated_at.
    const patch: Record<string, unknown> = {
      [attemptField]:   Number(job[attemptField] ?? 0) + 1,
      total_cost_usd:   Number(job.total_cost_usd ?? 0) + (isSuccess ? perJobCost : 0),
      next_retry_at:    null,   // release claim lock
      updated_at:       now,
    };

    if (isSuccess) {
      // SUCCESS: write enrichment fields, clear failure reasons
      Object.assign(patch, enrichment);
      patch[failureField] = null;
      patch.last_error    = null;

      // Status transitions
      if (params.method === "ai") {
        if (job.status === "new") patch.status = "ai_enriched";
        // Auto-dismiss agency posts (high-confidence signal from AI)
        if (enrichment.ai_poster_type === "agency_recruiter") {
          patch.status = "recruiter_dismissed";
        }
      } else if (params.method === "apollo" && enrichment.dm_name) {
        if (job.status === "ai_enriched") patch.status = "dm_enriched";
      }
    } else {
      // FAILURE: record reason (attempts already incremented above)
      patch[failureField] = `${params.method} returned no data`;
      patch.last_error    = `${params.method}: no enrichment returned`;
    }

    const { error } = await db.from("job_leads").update(patch).eq("id", jobId);
    if (error) {
      console.error(`[enrichHelpers] Failed to update job ${jobId}:`, error.message);
      return { jobId, ok: false, fromStage, toStage: fromStage, isSuccess: false };
    }

    const updatedJob = { ...job, ...patch };
    const toStage = computeStage(updatedJob as Parameters<typeof computeStage>[0]);
    return { jobId, ok: true, fromStage, toStage, isSuccess };
  }));

  // Fire all stage-transition audit writes in parallel (fire-and-forget; we don't
  // want a flaky audit write to take down the main write path).
  const transitionsToLog = results.filter((r) => r.ok && r.fromStage !== r.toStage);
  Promise.all(transitionsToLog.map((r) =>
    logStageTransition({
      job_id:      r.jobId,
      from_stage:  r.fromStage,
      to_stage:    r.toStage,
      success:     r.isSuccess,
      reason:      `${params.method} enrichment`,
      cost_usd:    r.isSuccess ? perJobCost : 0,
      duration_ms: perJobDurationMs,
      error_msg:   r.isSuccess ? null : `No ${params.method} result`,
    }).catch((e) => console.error("[enrichHelpers] transition log failed:", e)),
  )).catch(() => {});

  const successes  = results.filter((r) => r.ok && r.isSuccess).length;
  const failures   = results.filter((r) => !r.ok || !r.isSuccess).length;
  const transitions = transitionsToLog.length;

  return { successes, failures, transitions };
}

/** Release the claim lock (next_retry_at) for a set of jobs without touching
 *  other fields. Use when the worker bails out before calling applyEnrichmentsBatch
 *  (e.g. a TransientApiError). Jobs become eligible for retry immediately. */
export async function releaseClaimLocks(jobIds: string[]): Promise<void> {
  if (!jobIds.length) return;
  const db = getEngineAdmin();
  await db
    .from("job_leads")
    .update({ next_retry_at: null, updated_at: new Date().toISOString() })
    .in("id", jobIds);
}

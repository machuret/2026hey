// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Stage — single source of truth for what stage a job is in.
// Stage is COMPUTED from existing fields (status, ai_enriched_at, dm_name, etc)
// so there's no risk of stored `stage` drifting from `status`.
// ═══════════════════════════════════════════════════════════════════════════

import type { JobLead } from "@/app/engine/jobs/types";

export type PipelineStage =
  | "pending"      // new, awaiting AI analysis
  | "qualified"    // AI classified as direct_employer, awaiting DM search
  | "dead_end"     // AI classified as agency_recruiter — auto-dismissable
  | "enriched"     // DM found (name + email OR linkedin) — ready to review
  | "stuck_no_dm"  // Qualified but DM search exhausted (3 attempts)
  | "ready"        // Enriched and ready to push (alias of enriched in practice)
  | "pushed"       // pushed_to_crm
  | "smartleaded"  // pushed_to_smartlead
  | "dismissed";   // dismissed or recruiter_dismissed

/**
 * Score is informational only (sorting / display) — it does NOT gate
 * pipeline progression. The only gate for DM search is
 * `ai_poster_type === "direct_employer"`. Score ≥ 6 was previously a hard
 * cutoff; removed because gpt-4o-mini's 1-10 score is too subjective to
 * block on, and ~30-40% of otherwise-valid direct-employer leads were
 * being dropped for no reason.
 */
export const DM_SEARCH_MAX_ATTEMPTS = 3;
export const AI_MAX_ATTEMPTS = 2;

/** Compute the pipeline stage of a job from its current fields. */
export function computeStage(job: Pick<JobLead,
  | "status" | "ai_enriched_at" | "ai_relevance_score" | "ai_poster_type"
  | "dm_name" | "dm_email" | "dm_linkedin_url"
> & { dm_attempts?: number }): PipelineStage {
  // Terminal states first
  if (job.status === "pushed_to_crm") return "pushed";
  if (job.status === "pushed_to_smartlead") return "smartleaded";
  if (job.status === "dismissed" || job.status === "recruiter_dismissed") return "dismissed";

  // Has DM → enriched (ready to push)
  if (job.dm_name && (job.dm_email || job.dm_linkedin_url)) return "enriched";

  // AI done
  if (job.ai_enriched_at) {
    const attempts = job.dm_attempts ?? 0;
    // Only `direct_employer` (AI classification) qualifies for DM search.
    // Score is informational — NOT a gate. See comment above.
    const qualified = job.ai_poster_type === "direct_employer";

    if (!qualified) return "dead_end";
    if (attempts >= DM_SEARCH_MAX_ATTEMPTS) return "stuck_no_dm";
    return "qualified";
  }

  return "pending";
}

/** Valid transitions: next stages a job can legitimately move to. */
export const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  pending:     ["qualified", "dead_end", "dismissed"],
  qualified:   ["enriched", "stuck_no_dm", "dismissed"],
  dead_end:    ["dismissed"],                // auto-dismiss dead ends
  stuck_no_dm: ["enriched", "dismissed"],    // retry might succeed
  enriched:    ["ready", "pushed", "smartleaded", "dismissed"],
  ready:       ["pushed", "smartleaded", "dismissed"],
  pushed:      ["smartleaded"],              // CRM leads can still go to SmartLead
  smartleaded: [],                           // terminal — owned by SmartLead now
  dismissed:   [],                           // terminal
};

/** Human-friendly labels for UI */
export const STAGE_LABELS: Record<PipelineStage, string> = {
  pending:     "Pending",
  qualified:   "Qualified",
  dead_end:    "Not Relevant",
  enriched:    "Enriched",
  stuck_no_dm: "Stuck — No DM",
  ready:       "Ready",
  pushed:      "In CRM",
  smartleaded: "In SmartLead",
  dismissed:   "Dismissed",
};

export const STAGE_DESCRIPTIONS: Record<PipelineStage, string> = {
  pending:     "New scrape, awaiting AI analysis",
  qualified:   "AI approved, searching for decision maker",
  dead_end:    "AI rejected (low score or agency post)",
  enriched:    "Decision maker found, ready for review",
  stuck_no_dm: "AI approved but no DM found after 3 attempts",
  ready:       "Fully enriched, ready to push to CRM",
  pushed:      "Already in CRM",
  smartleaded: "Pushed to a SmartLead cold-email campaign",
  dismissed:   "Dismissed manually or automatically",
};


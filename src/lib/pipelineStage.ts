// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Stage — single source of truth for what stage a job is in.
// Stage is COMPUTED from existing fields (status, ai_enriched_at, dm_name, etc)
// so there's no risk of stored `stage` drifting from `status`.
// ═══════════════════════════════════════════════════════════════════════════

import type { JobLead } from "@/app/engine/jobs/types";

export type PipelineStage =
  | "pending"      // new, awaiting AI analysis
  | "qualified"    // AI said yes (score ≥ 6, internal poster), awaiting DM search
  | "dead_end"     // AI said no (low score or agency) — auto-dismissable
  | "enriched"     // DM found (name + email OR linkedin) — ready to review
  | "stuck_no_dm"  // Qualified but DM search exhausted (3 attempts)
  | "ready"        // Enriched and ready to push (alias of enriched in practice)
  | "pushed"       // pushed_to_crm
  | "dismissed";   // dismissed or recruiter_dismissed

export const AI_QUALIFIED_SCORE_THRESHOLD = 6;
export const DM_SEARCH_MAX_ATTEMPTS = 3;
export const AI_MAX_ATTEMPTS = 2;

/** Compute the pipeline stage of a job from its current fields. */
export function computeStage(job: Pick<JobLead,
  | "status" | "ai_enriched_at" | "ai_relevance_score" | "ai_poster_type"
  | "dm_name" | "dm_email" | "dm_linkedin_url"
> & { dm_attempts?: number }): PipelineStage {
  // Terminal states first
  if (job.status === "pushed_to_crm") return "pushed";
  if (job.status === "dismissed" || job.status === "recruiter_dismissed") return "dismissed";

  // Has DM → enriched (ready to push)
  if (job.dm_name && (job.dm_email || job.dm_linkedin_url)) return "enriched";

  // AI done
  if (job.ai_enriched_at) {
    const attempts = job.dm_attempts ?? 0;
    const qualified =
      (job.ai_relevance_score ?? 0) >= AI_QUALIFIED_SCORE_THRESHOLD &&
      job.ai_poster_type === "internal";

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
  enriched:    ["ready", "pushed", "dismissed"],
  ready:       ["pushed", "dismissed"],
  pushed:      [],                           // terminal
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
  dismissed:   "Dismissed manually or automatically",
};

/** SQL fragments for server-side filtering by stage.
 *  Use with Supabase query builder via `.or()` / `.filter()`. */
export const STAGE_SQL_FILTERS = {
  pending:
    "status=neq.pushed_to_crm,status=neq.dismissed,status=neq.recruiter_dismissed,ai_enriched_at=is.null",
  qualified:
    "ai_enriched_at=not.is.null,ai_relevance_score=gte.6,ai_poster_type=eq.internal,dm_name=is.null,dm_attempts=lt.3",
  dead_end:
    "ai_enriched_at=not.is.null,or=(ai_relevance_score.lt.6,ai_poster_type.neq.internal)",
  stuck_no_dm:
    "ai_enriched_at=not.is.null,dm_name=is.null,dm_attempts=gte.3",
  enriched:
    "dm_name=not.is.null,or=(dm_email.not.is.null,dm_linkedin_url.not.is.null),status=neq.pushed_to_crm,status=neq.dismissed",
  pushed:
    "status=eq.pushed_to_crm",
  dismissed:
    "or=(status.eq.dismissed,status.eq.recruiter_dismissed)",
} as const;

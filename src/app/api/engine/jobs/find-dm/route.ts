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
  synthesizeSeekListingDM,
} from "@/lib/engineEnrichHelpers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/engine/jobs/find-dm
 * Stage transition: qualified → enriched | stuck_no_dm
 *
 * Three-pass DM discovery (fail-forward chain):
 *   Pass 1 — OpenAI web search + LinkedIn scraper (best for AU SMBs)
 *            → dm_source = 'openai_linkedin' (full: name+URL+maybe email)
 *            → dm_source = 'openai'          (partial: name only, no URL)
 *   Pass 2 — Apollo (US-biased but authoritative when it hits)
 *            → dm_source = 'apollo' (name+email+phone+LinkedIn URL)
 *   Pass 3 — Seek-listing fallback (free, uses fields already on row)
 *            → dm_source = 'seek_listing'
 *
 * Each pass only runs on jobs the prior passes didn't resolve. After all
 * three, jobs without any DM get dm_attempts++ and dm_failure_reason set.
 * After 3 total attempts, the job enters stuck_no_dm.
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

    // Sanity: only process direct-employer jobs (agencies are competitors
    // and auto-dismissed). Score is NOT a gate — it's too subjective to
    // block on. See src/lib/pipelineStage.ts for rationale.
    const eligible = jobs.filter((j) =>
      j.ai_enriched_at != null &&
      j.ai_poster_type === "direct_employer" &&
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
    // Accumulate enrichments across passes. An earlier pass's hit is never
    // overwritten (earlier source = higher priority in the chain).
    const realEnrichments: Record<string, Record<string, unknown>> = {};
    let totalCostUsd = 0;
    let openaiCount = 0;  // Pass 1 hits (openai or openai_linkedin)
    let apolloCount = 0;  // Pass 2 hits
    let seekCount   = 0;  // Pass 3 hits

    // ── Pass 1: OpenAI web search + LinkedIn scraper ────────────────────
    // Soft-fail this pass on any error — Pass 2 (Apollo) will still run for
    // every job. This keeps the chain resilient when OpenAI is rate-limited
    // or the search-preview model is temporarily unavailable.
    try {
      const { enrichments: oaResults, costUsd: oaCost } = await callEnrichEdgeFn({
        method: "openai_search",
        jobs: eligible.map(trimForEnrich),
        req,
        api: "openai",
      });
      totalCostUsd += oaCost;
      for (const [id, fields] of Object.entries(oaResults)) {
        // Edge fn already filtered for a usable contact channel, but
        // double-check here for belt-and-braces.
        if (fields.dm_name && (fields.dm_linkedin_url || fields.dm_email)) {
          realEnrichments[id] = fields; // edge fn already stamped dm_source
          openaiCount++;
        }
      }
    } catch (e) {
      console.error("[find-dm] OpenAI search pass failed:", extractErrorMsg(e));
    }

    // ── Pass 2: Apollo ──────────────────────────────────────────────────
    const apolloTargets = eligible.filter((j) => !realEnrichments[String(j.id)]);
    if (apolloTargets.length) {
      const { enrichments: apolloResults, costUsd: apolloCost } = await callEnrichEdgeFn({
        method: "apollo",
        jobs: apolloTargets.map(trimForEnrich),
        req,
        api: "apollo",
      });
      totalCostUsd += apolloCost;
      for (const [id, fields] of Object.entries(apolloResults)) {
        if (fields.dm_name && (fields.dm_email || fields.dm_linkedin_url)) {
          realEnrichments[id] = { ...fields, dm_source: "apollo" };
          apolloCount++;
        }
      }
    }

    // ── Pass 3: Seek-listing fallback ──────────────────────────────────
    // Zero cost, no extra API call. Uses contact fields already on the row.
    for (const job of eligible) {
      const id = String(job.id);
      if (realEnrichments[id]) continue;
      const synth = synthesizeSeekListingDM({
        emails:          (job.emails as string[] | null | undefined) ?? [],
        phone_numbers:   (job.phone_numbers as string[] | null | undefined) ?? [],
        recruiter_name:  (job.recruiter_name as string | null | undefined) ?? null,
        recruiter_phone: (job.recruiter_phone as string | null | undefined) ?? null,
      });
      if (synth) {
        realEnrichments[id] = synth;
        seekCount++;
      }
    }

    const durationMs = Date.now() - start;

    const summary = await applyEnrichmentsBatch({
      method: "apollo", // uses the ai_enriched → dm_enriched transition path for ALL sources
      originalJobs: eligible,
      enrichments: realEnrichments,
      costUsd: totalCostUsd,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      stage: "find-dm",
      requested: ids.length,
      processed: eligible.length,
      skipped: jobs.length - eligible.length,
      costUsd: totalCostUsd,
      dm_found: summary.successes,
      dm_not_found: summary.failures,
      dm_by_source: {
        openai:       openaiCount,
        apollo:       apolloCount,
        seek_listing: seekCount,
      },
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

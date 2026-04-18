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
 * Two-pass DM discovery:
 *   Pass 1 — Apollo (paid API) — authoritative source, stamped dm_source='apollo'
 *   Pass 2 — Seek-listing fallback (free) — for jobs Apollo couldn't find,
 *            synthesize a DM from the listing's own recruiter_name / emails[]
 *            / phone_numbers[] captured at scrape time. Stamped dm_source=
 *            'seek_listing' so downstream tooling can filter weaker contacts.
 *
 * After both passes, jobs without any DM get dm_attempts++ and
 * dm_failure_reason set. After 3 attempts total, they enter stuck_no_dm.
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

    // ── Pass 1: Apollo ─────────────────────────────────────────────────
    const start = Date.now();
    const { enrichments: apolloEnrichments, costUsd } = await callEnrichEdgeFn({
      method: "apollo",
      jobs: eligible.map(trimForEnrich),
      req,
      api: "apollo",
    });

    // Only count Apollo rows as real hits if they have both a name AND a
    // contact channel (email OR LinkedIn). Stamp dm_source='apollo' so
    // downstream can tell it apart from the Seek fallback.
    const realEnrichments: Record<string, Record<string, unknown>> = {};
    for (const [id, fields] of Object.entries(apolloEnrichments)) {
      if (fields.dm_name && (fields.dm_email || fields.dm_linkedin_url)) {
        realEnrichments[id] = { ...fields, dm_source: "apollo" };
      }
      // else: don't include yet — Pass 2 gets a shot at it
    }

    // ── Pass 2: Seek-listing fallback ──────────────────────────────────
    // For jobs Apollo couldn't find, use the contact fields already on
    // the row (captured at scrape time). Zero cost, no extra API call.
    let seekFallbackCount = 0;
    for (const job of eligible) {
      const id = String(job.id);
      if (realEnrichments[id]) continue; // Apollo already won
      const synth = synthesizeSeekListingDM({
        emails:          (job.emails as string[] | null | undefined) ?? [],
        phone_numbers:   (job.phone_numbers as string[] | null | undefined) ?? [],
        recruiter_name:  (job.recruiter_name as string | null | undefined) ?? null,
        recruiter_phone: (job.recruiter_phone as string | null | undefined) ?? null,
      });
      if (synth) {
        realEnrichments[id] = synth;
        seekFallbackCount++;
      }
      // else: truly no contact data — applyEnrichmentsBatch marks as failure
    }

    const durationMs = Date.now() - start;

    const summary = await applyEnrichmentsBatch({
      method: "apollo",
      originalJobs: eligible,
      enrichments: realEnrichments,
      costUsd,
      durationMs,
    });

    const apolloCount = summary.successes - seekFallbackCount;

    return NextResponse.json({
      success: true,
      stage: "find-dm",
      requested: ids.length,
      processed: eligible.length,
      skipped: jobs.length - eligible.length,
      costUsd,
      dm_found: summary.successes,
      dm_not_found: summary.failures,
      dm_by_source: {
        apollo:       Math.max(0, apolloCount),
        seek_listing: seekFallbackCount,
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

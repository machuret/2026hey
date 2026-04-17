// ═══════════════════════════════════════════════════════════════════════════
// GET /api/engine/debug/snapshot
//
// One-shot diagnostic: a full picture of the pipeline's state. Intended
// for "where did my jobs go?" investigations.
//
// Returns JSON:
//   {
//     counts: { by_status: {...}, by_stage: {...} },
//     recent_jobs: [ 50 newest jobs with key fields ],
//     stage_transitions: [ 20 most recent audit rows ],
//     api_errors: [ 20 most recent engine_api_usage rows with error_code ],
//     autopilot_ticks: [ 20 most recent autopilot tick rows ],
//     timestamp: ISO
//   }
//
// Safe to curl — admin-only (cookie auth required).
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const db = getEngineAdmin();

    // ── Parallel fetch for speed ──────────────────────────────────────────
    const [
      statusCountsRes,
      stageCountsRes,
      recentJobsRes,
      transitionsRes,
      apiUsageRes,
      ticksRes,
    ] = await Promise.all([
      // Status breakdown — raw DB status column
      db.rpc("engine_debug_status_counts").then(
        (r) => r,
        () => ({ data: null, error: "rpc_missing" }),
      ),
      // Stage breakdown — from the existing view
      db.from("engine_pipeline_stats").select("stage, job_count"),
      // Recent 50 jobs with everything a human needs to find their work
      db.from("job_leads").select(
        "id, company_name, job_title, status, source, " +
        "ai_enriched_at, ai_relevance_score, ai_poster_type, " +
        "dm_name, dm_email, dm_linkedin_url, dm_attempts, " +
        "smartlead_pushed_at, smartlead_campaign_name, " +
        "created_at, updated_at",
      ).order("updated_at", { ascending: false }).limit(50),
      // Recent stage transitions (if table exists)
      db.from("engine_stage_transitions")
        .select("id, job_id, from_stage, to_stage, reason, created_at")
        .order("created_at", { ascending: false }).limit(20),
      // Recent API errors
      db.from("engine_api_usage")
        .select("id, api, action, status_code, error_code, error_message, cost_usd, created_at")
        .not("error_code", "is", null)
        .order("created_at", { ascending: false }).limit(20),
      // Recent autopilot ticks (across all runs)
      db.from("engine_autopilot_ticks")
        .select("id, run_id, seq, stage, status, message, processed, successes, failures, cost_usd, at")
        .order("at", { ascending: false }).limit(20),
    ]);

    // Fallback status counts: sum from the recent_jobs sample if rpc missing
    const byStatus: Record<string, number> = {};
    if (statusCountsRes.data && Array.isArray(statusCountsRes.data)) {
      for (const r of statusCountsRes.data as { status: string; count: number }[]) {
        byStatus[r.status] = Number(r.count);
      }
    } else {
      // Compute inline if rpc not present
      const { data } = await db.from("job_leads").select("status");
      for (const r of (data ?? []) as { status: string }[]) {
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      }
    }

    const byStage: Record<string, number> = {};
    for (const r of (stageCountsRes.data ?? []) as { stage: string; job_count: number }[]) {
      byStage[r.stage] = Number(r.job_count);
    }

    return NextResponse.json({
      success:   true,
      timestamp: new Date().toISOString(),
      counts: {
        by_status: byStatus,
        by_stage:  byStage,
        total:     Object.values(byStatus).reduce((a, b) => a + b, 0),
      },
      recent_jobs:       recentJobsRes.data       ?? [],
      stage_transitions: transitionsRes.data      ?? [],
      api_errors:        apiUsageRes.data         ?? [],
      autopilot_ticks:   ticksRes.data            ?? [],
      // Surface partial errors so missing tables don't silently hide
      notes: {
        transitions_ok: !transitionsRes.error,
        api_usage_ok:   !apiUsageRes.error,
        autopilot_ok:   !ticksRes.error,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/engine/jobs/stats
 * Returns count of jobs in each pipeline stage for nav badges.
 * Reads from the engine_pipeline_stats view (defined in migration 20260418).
 */
export async function GET(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_pipeline_stats")
      .select("stage, job_count");

    if (error) throw error;

    const stats: Record<string, number> = {};
    for (const row of (data ?? []) as { stage: string; job_count: number }[]) {
      stats[row.stage] = Number(row.job_count);
    }

    return NextResponse.json({ success: true, stats });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

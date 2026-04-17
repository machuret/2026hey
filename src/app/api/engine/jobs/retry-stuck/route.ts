import { NextRequest, NextResponse } from "next/server";
import { requireEngineAuth } from "@/lib/engineAuth";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/engine/jobs/retry-stuck
 * Resets dm_attempts counter back to 0 for selected jobs, letting them be
 * picked up again by the DM search worker. Use when you want to re-try jobs
 * stuck in `stuck_no_dm`.
 *
 * Body: { jobIds: string[] }  — or omit to retry ALL stuck jobs
 */
export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = Array.isArray(body.jobIds) ? body.jobIds : undefined;

    const db = getEngineAdmin();
    let query = db
      .from("job_leads")
      .update({
        dm_attempts: 0,
        dm_failure_reason: null,
        last_error: null,
        next_retry_at: null,
        updated_at: new Date().toISOString(),
      })
      .not("ai_enriched_at", "is", null)
      .is("dm_name", null);

    if (ids && ids.length > 0) {
      query = query.in("id", ids);
    } else {
      query = query.gte("dm_attempts", 3);
    }

    const { data, error } = await query.select("id");
    if (error) throw error;

    return NextResponse.json({
      success: true,
      reset: data?.length ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

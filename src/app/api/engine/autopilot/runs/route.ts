// ═══════════════════════════════════════════════════════════════════════════
// GET /api/engine/autopilot/runs
//   ?active=1     → returns currently running/paused run (or null)
//   (otherwise)   → returns most recent N runs (default 20)
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
    const url = new URL(req.url);

    if (url.searchParams.get("active") === "1") {
      const { data, error } = await db
        .from("engine_autopilot_runs")
        .select("*")
        .in("status", ["running", "paused"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json({ success: true, run: data });
    }

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);
    const { data, error } = await db
      .from("engine_autopilot_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    return NextResponse.json({ success: true, runs: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

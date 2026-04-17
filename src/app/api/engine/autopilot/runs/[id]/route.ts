// ═══════════════════════════════════════════════════════════════════════════
// GET /api/engine/autopilot/runs/[id]
//   → returns { run, ticks } for the given run id
//   ?since_seq=N  → returns only ticks with seq > N (for efficient polling)
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const db = getEngineAdmin();

    const { data: run, error: runErr } = await db
      .from("engine_autopilot_runs").select("*").eq("id", id).maybeSingle();
    if (runErr) throw runErr;
    if (!run)   return NextResponse.json({ error: "run not found" }, { status: 404 });

    const url = new URL(req.url);
    const sinceSeq = Number(url.searchParams.get("since_seq")) || 0;

    let query = db
      .from("engine_autopilot_ticks")
      .select("*")
      .eq("run_id", id)
      .order("seq", { ascending: false })
      .limit(200);
    if (sinceSeq > 0) query = query.gt("seq", sinceSeq);

    const { data: ticks, error: ticksErr } = await query;
    if (ticksErr) throw ticksErr;

    return NextResponse.json({ success: true, run, ticks: ticks ?? [] });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

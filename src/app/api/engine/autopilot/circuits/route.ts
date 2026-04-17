// GET  /api/engine/autopilot/circuits           → list circuit states
// POST /api/engine/autopilot/circuits { api }    → manually reset (close) a breaker
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
    const { data, error } = await db.from("engine_api_circuits").select("*").order("api");
    if (error) throw error;
    return NextResponse.json({ success: true, circuits: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;
  try {
    const { api } = (await req.json().catch(() => ({}))) as { api?: string };
    if (!api) return NextResponse.json({ error: "api is required" }, { status: 400 });

    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_api_circuits")
      .update({ state: "closed", consecutive_fails: 0, opened_at: null, last_error: null })
      .eq("api", api)
      .select("*").single();
    if (error) throw error;
    return NextResponse.json({ success: true, circuit: data });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

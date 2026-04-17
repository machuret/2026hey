// ═══════════════════════════════════════════════════════════════════════════
// POST /api/engine/autopilot/control
// Body: { run_id: string, action: "cancel"|"pause"|"resume" }
//
// Single endpoint for all run-control verbs. Cleaner than 3 separate routes
// because the validation is identical.
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";
import type { AutopilotRun } from "@/lib/autopilot";

export const dynamic = "force-dynamic";

type Action = "cancel" | "pause" | "resume";

interface Body { run_id?: string; action?: Action }

export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const { run_id, action } = (await req.json().catch(() => ({}))) as Body;
    if (!run_id) return NextResponse.json({ error: "run_id is required" }, { status: 400 });
    if (!action || !["cancel","pause","resume"].includes(action)) {
      return NextResponse.json({ error: "action must be 'cancel', 'pause' or 'resume'" }, { status: 400 });
    }

    const db = getEngineAdmin();
    const { data: run, error: loadErr } = await db
      .from("engine_autopilot_runs").select("*").eq("id", run_id).maybeSingle();
    if (loadErr) throw loadErr;
    if (!run) return NextResponse.json({ error: "run not found" }, { status: 404 });
    const typedRun = run as AutopilotRun;

    const patch: Record<string, unknown> = {};

    if (action === "cancel") {
      if (typedRun.status !== "running" && typedRun.status !== "paused") {
        return NextResponse.json({
          error: `cannot cancel a ${typedRun.status} run`,
        }, { status: 409 });
      }
      patch.status        = "cancelled";
      patch.finished_at   = new Date().toISOString();
      patch.finish_reason = "cancelled";
      patch.paused_at     = null;
    } else if (action === "pause") {
      if (typedRun.status !== "running") {
        return NextResponse.json({
          error: `cannot pause a ${typedRun.status} run`,
        }, { status: 409 });
      }
      patch.status    = "paused";
      patch.paused_at = new Date().toISOString();
    } else if (action === "resume") {
      if (typedRun.status !== "paused") {
        return NextResponse.json({
          error: `cannot resume a ${typedRun.status} run`,
        }, { status: 409 });
      }
      patch.status    = "running";
      patch.paused_at = null;
    }

    const { data: updated, error: updErr } = await db
      .from("engine_autopilot_runs").update(patch).eq("id", run_id).select("*").single();
    if (updErr) throw updErr;

    return NextResponse.json({ success: true, run: updated });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

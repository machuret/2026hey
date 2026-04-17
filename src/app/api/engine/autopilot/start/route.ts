// ═══════════════════════════════════════════════════════════════════════════
// POST /api/engine/autopilot/start
// Creates a new AutoPilot run. Refuses if another run is already active.
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";
import {
  AUTOPILOT_DEFAULT_BATCH,
  AUTOPILOT_DEFAULT_MAX_TICKS,
  type AutopilotStage,
} from "@/lib/autopilot";

export const dynamic = "force-dynamic";

const VALID_STAGES: readonly AutopilotStage[] = ["analyze", "find-dm"];

interface StartBody {
  stages?:       AutopilotStage[];
  batch_size?:   number;
  max_ticks?:    number;
  max_cost_usd?: number | null;
  triggered_by?: string;
}

export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const body = (await req.json().catch(() => ({}))) as StartBody;

    // Validate stages
    const stages = Array.isArray(body.stages) && body.stages.length > 0
      ? body.stages.filter((s): s is AutopilotStage => VALID_STAGES.includes(s))
      : [...VALID_STAGES];
    if (stages.length === 0) {
      return NextResponse.json({ error: "at least one valid stage required" }, { status: 400 });
    }

    const batchSize = clamp(Number(body.batch_size) || AUTOPILOT_DEFAULT_BATCH, 1, 50);
    const maxTicks  = clamp(Number(body.max_ticks)  || AUTOPILOT_DEFAULT_MAX_TICKS, 1, 1000);
    const maxCost   = body.max_cost_usd == null ? null : Math.max(0, Number(body.max_cost_usd));

    const db = getEngineAdmin();

    // Refuse if a run is already active (running OR paused)
    const { data: active } = await db
      .from("engine_autopilot_runs")
      .select("id, status")
      .in("status", ["running", "paused"])
      .limit(1)
      .maybeSingle();

    if (active) {
      return NextResponse.json({
        error:  "An AutoPilot run is already active",
        run_id: active.id,
        status: active.status,
      }, { status: 409 });
    }

    const { data: run, error } = await db
      .from("engine_autopilot_runs")
      .insert({
        stages,
        batch_size:   batchSize,
        max_ticks:    maxTicks,
        max_cost_usd: maxCost,
        triggered_by: body.triggered_by ?? "manual",
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, run });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

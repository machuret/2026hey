// ═══════════════════════════════════════════════════════════════════════════
// POST /api/engine/autopilot/tick
// Body: { run_id: string }
//
// Executes ONE tick of the specified run. Idempotent-ish: if the run is
// no longer 'running', returns its current state without doing work.
//
// Callers: client polling loop, pg_cron scheduler.
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";
import { dispatchOneTick, type DispatchOutcome } from "@/lib/autopilotDispatch";
import type { AutopilotRun } from "@/lib/autopilot";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Db = ReturnType<typeof getEngineAdmin>;

interface TickBody { run_id?: string }

export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const { run_id } = (await req.json().catch(() => ({}))) as TickBody;
    if (!run_id) return NextResponse.json({ error: "run_id is required" }, { status: 400 });

    const db = getEngineAdmin();

    // ── Load the run row (authoritative state) ─────────────────────────────
    const { data: run, error: loadErr } = await db
      .from("engine_autopilot_runs").select("*").eq("id", run_id).maybeSingle();
    if (loadErr) throw loadErr;
    if (!run) return NextResponse.json({ error: "run not found" }, { status: 404 });
    const typedRun = run as AutopilotRun;

    // If run is no longer executable, just return its state
    if (typedRun.status !== "running") {
      return NextResponse.json({ success: true, skipped: true, run });
    }

    // ── Respect safety limits ─────────────────────────────────────────────
    if (typedRun.ticks_completed >= typedRun.max_ticks) {
      return await finishRun(db, typedRun, "completed", "max_ticks", null);
    }

    // ── Execute one tick ──────────────────────────────────────────────────
    const nextSeq = typedRun.ticks_completed + 1;
    const outcome = await dispatchOneTick({ run: typedRun, req, db });

    // ── Persist the tick row + update run counters in one atomic-ish pass ──
    await writeTickRow(db, typedRun.id, nextSeq, outcome);

    const newRun = await updateRunFromOutcome(db, typedRun, outcome);
    if (!newRun) throw new Error("Failed to update run state");

    return NextResponse.json({ success: true, outcome, run: newRun });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

// ─── Persistence helpers ────────────────────────────────────────────────────

async function writeTickRow(
  db: Db, runId: string, seq: number, outcome: DispatchOutcome,
): Promise<void> {
  const row = tickRowFromOutcome(runId, seq, outcome);
  const { error } = await db.from("engine_autopilot_ticks").insert(row);
  if (error) console.error("[autopilot/tick] failed to write tick row:", error);
}

function tickRowFromOutcome(runId: string, seq: number, o: DispatchOutcome) {
  const base = { run_id: runId, seq };
  switch (o.kind) {
    case "ok":
      return {
        ...base, stage: o.stage, status: "ok" as const,
        message:
          o.stage === "analyze" ? `${o.successes}/${o.processed} analyzed`
          : o.stage === "find-dm" ? `${o.dm_found ?? 0}/${o.processed} DMs${o.dm_not_found ? ` · ${o.dm_not_found} missed` : ""}`
          : `${o.processed} processed`,
        processed: o.processed, successes: o.successes, failures: o.failures, cost_usd: o.costUsd,
      };
    case "done":
      return { ...base, stage: "—", status: "done" as const, message: "No eligible jobs remaining" };
    case "budget":
      return { ...base, stage: o.api, status: "budget" as const, message: `Budget: ${o.reason}`, error_code: "BUDGET_EXCEEDED" };
    case "circuit_open":
      return { ...base, stage: o.api, status: "circuit_open" as const, message: `Circuit breaker open for ${o.api}`, error_code: "CIRCUIT_OPEN" };
    case "cost_cap":
      return { ...base, stage: "—", status: "cost_cap" as const, message: `Cost cap reached: $${o.spent.toFixed(4)} / $${o.cap.toFixed(4)}`, error_code: "COST_CAP" };
    case "error":
      return {
        ...base, stage: "—", status: "fail" as const, message: o.message,
        error_code: o.transient ? "TRANSIENT" : "ERROR",
      };
  }
}

/** Update the run row based on the outcome. Returns the fresh row (or null on failure). */
async function updateRunFromOutcome(
  db: Db, run: AutopilotRun, o: DispatchOutcome,
): Promise<AutopilotRun | null> {
  // Decide whether this is terminal for the run
  const isTerminal =
    o.kind === "done"         ||
    o.kind === "budget"       ||
    o.kind === "circuit_open" ||
    o.kind === "cost_cap";

  const patch: Record<string, unknown> = {
    ticks_completed: run.ticks_completed + 1,
  };

  if (o.kind === "ok") {
    patch.processed = run.processed + o.processed;
    patch.cost_usd  = Number(run.cost_usd) + Number(o.costUsd);
    if (o.stage === "analyze") patch.analyzed  = run.analyzed  + o.successes;
    if (o.stage === "find-dm") patch.dms_found = run.dms_found + (o.dm_found ?? 0);
    patch.failures = run.failures + o.failures;
  } else if (o.kind === "error") {
    patch.last_error = o.message;
    if (!o.transient) {
      // Hard errors fail the run
      patch.status        = "failed";
      patch.finished_at   = new Date().toISOString();
      patch.finish_reason = "error";
    }
  }

  if (isTerminal) {
    patch.status        = "completed";
    patch.finished_at   = new Date().toISOString();
    patch.finish_reason =
      o.kind === "done"         ? "done"     :
      o.kind === "budget"       ? "budget"   :
      o.kind === "circuit_open" ? "circuit"  :
      o.kind === "cost_cap"     ? "cost_cap" :
      "done";
  }

  // If we've now hit max_ticks, also terminate
  if (!isTerminal && (patch.ticks_completed as number) >= run.max_ticks) {
    patch.status        = "completed";
    patch.finished_at   = new Date().toISOString();
    patch.finish_reason = "max_ticks";
  }

  const { data, error } = await db
    .from("engine_autopilot_runs").update(patch).eq("id", run.id).select("*").single();
  if (error) { console.error("[autopilot/tick] run update failed:", error); return null; }
  return data as AutopilotRun;
}

async function finishRun(
  db: Db, run: AutopilotRun, status: "completed" | "failed" | "cancelled",
  reason: string, errorMsg: string | null,
): Promise<NextResponse> {
  const { data, error } = await db
    .from("engine_autopilot_runs")
    .update({
      status, finished_at: new Date().toISOString(),
      finish_reason: reason, last_error: errorMsg,
    })
    .eq("id", run.id).select("*").single();
  if (error) return NextResponse.json({ error: extractErrorMsg(error) }, { status: 500 });
  return NextResponse.json({ success: true, skipped: true, run: data });
}

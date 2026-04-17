"use client";

// ═══════════════════════════════════════════════════════════════════════════
// AutoPilotV2 — calls /api/engine/jobs/tick in a loop.
// Each tick processes one batch of one stage; pauses automatically on:
//   - Budget exceeded (HTTP 429)
//   - No more eligible jobs (done: true)
//   - User cancel
//   - Network / server error
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useRef, useState } from "react";
import { Rocket, Loader2 } from "lucide-react";
import { emitPipelineRefresh } from "../pipelineEvents";

type TickResult = {
  success: boolean;
  done?: boolean;
  stage?: string;
  processed?: number;
  successes?: number;
  failures?: number;
  dm_found?: number;
  dm_not_found?: number;
  costUsd?: number;
  code?: string;
  reason?: string;
  api?: string;
  error?: string;
};

const MAX_TICKS_PER_RUN = 20;      // safety ceiling
const DELAY_BETWEEN_TICKS_MS = 2_000;

export default function AutoPilotV2() {
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState<{ ticks: number; processed: number; cost: number }>(
    { ticks: 0, processed: 0, cost: 0 },
  );
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    abortRef.current = new AbortController();
    setRunning(true);
    setMsg("AutoPilot starting…");
    setStats({ ticks: 0, processed: 0, cost: 0 });

    let ticks = 0;
    let totalProcessed = 0;
    let totalCost = 0;

    try {
      while (ticks < MAX_TICKS_PER_RUN) {
        if (abortRef.current?.signal.aborted) {
          setMsg(`⏸ AutoPilot cancelled after ${ticks} ticks`);
          break;
        }

        ticks++;
        setMsg(`Tick ${ticks}/${MAX_TICKS_PER_RUN}…`);

        const res = await fetch("/api/engine/jobs/tick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchSize: 20 }),
          signal: abortRef.current.signal,
        });
        const data: TickResult = await res.json();

        // Budget exceeded → stop (not an error)
        if (res.status === 429 || data.code === "BUDGET_EXCEEDED") {
          setMsg(`⛔ Paused: budget exceeded for ${data.api ?? "API"} — ${data.reason ?? ""}`);
          break;
        }

        // Other errors → stop
        if (!data.success && !data.done) {
          setMsg(`⚠ Tick failed: ${data.error ?? data.reason ?? "unknown error"}`);
          break;
        }

        // No more work → done!
        if (data.done) {
          setMsg(`✓ AutoPilot complete — no more eligible jobs. ${ticks} ticks, ${totalProcessed} jobs, $${totalCost.toFixed(4)}`);
          break;
        }

        // Got work done → accumulate stats
        const processed = data.processed ?? 0;
        const cost = data.costUsd ?? 0;
        totalProcessed += processed;
        totalCost += cost;
        setStats({ ticks, processed: totalProcessed, cost: totalCost });
        emitPipelineRefresh();   // update nav badges + current page

        const detail = data.stage === "analyze"
          ? `${data.successes}/${processed} analyzed`
          : data.stage === "find-dm"
            ? `${data.dm_found}/${processed} DMs found`
            : `${processed} processed`;
        setMsg(`Tick ${ticks}: [${data.stage}] ${detail} · $${cost.toFixed(4)}`);

        // Throttle between ticks
        await new Promise<void>((resolve, reject) => {
          const to = setTimeout(resolve, DELAY_BETWEEN_TICKS_MS);
          abortRef.current?.signal.addEventListener("abort", () => {
            clearTimeout(to);
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      }

      if (ticks >= MAX_TICKS_PER_RUN) {
        setMsg(`⏹ AutoPilot stopped at safety limit (${MAX_TICKS_PER_RUN} ticks)`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMsg(`⏸ AutoPilot cancelled after ${ticks} ticks`);
      } else {
        setMsg(`⚠ AutoPilot crashed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <div className="flex items-center gap-3">
      {(msg || stats.ticks > 0) && (
        <span className={`text-xs ${msg.startsWith("⚠") || msg.startsWith("⛔") ? "text-red-400" : msg.startsWith("✓") ? "text-emerald-400" : "text-indigo-300"}`}>
          {msg}
        </span>
      )}
      <button
        onClick={running ? cancel : start}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
          running
            ? "bg-red-600 text-white hover:bg-red-500"
            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-900/30"
        }`}
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
        {running ? "Cancel AutoPilot" : "AutoPilot"}
      </button>
    </div>
  );
}

"use client";

// ═══════════════════════════════════════════════════════════════════════════
// useAutopilotRun — DB-backed AutoPilot client.
//
// 1. Loads the active run (if any) on mount
// 2. Polls /runs/:id every POLL_INTERVAL_MS while a run is active
// 3. Drives ticks (fires /tick) from the client while active
// 4. Retries transient network errors with exponential backoff
// 5. Exposes start/cancel/pause/resume helpers
//
// Survives browser refresh: reload re-fetches the active run and resumes
// polling/ticking exactly where it left off.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTOPILOT_POLL_INTERVAL_MS,
  AUTOPILOT_DELAY_BETWEEN_MS,
  AUTOPILOT_TICK_MAX_RETRIES,
  AUTOPILOT_RETRY_BACKOFF_BASE_MS,
  isActive, isTerminal,
  type AutopilotRun, type AutopilotTick, type AutopilotStage,
} from "@/lib/autopilot";
import { emitPipelineRefresh } from "@/app/engine/jobs/pipelineEvents";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export type StartConfig = {
  stages?:       AutopilotStage[];
  batch_size?:   number;
  max_ticks?:    number;
  max_cost_usd?: number | null;
};

type State = {
  run:      AutopilotRun | null;
  ticks:    AutopilotTick[];
  loading:  boolean;
  error:    string;
};

export function useAutopilotRun() {
  const [state, setState] = useState<State>({ run: null, ticks: [], loading: true, error: "" });
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickLoopRef  = useRef<AbortController | null>(null);
  const lastSeqRef   = useRef(0);

  // ── Load run + ticks by id ──────────────────────────────────────────────
  const loadRunDetails = useCallback(async (runId: string, reset = false) => {
    try {
      const sinceSeq = reset ? 0 : lastSeqRef.current;
      const res  = await fetch(`/api/engine/autopilot/runs/${runId}${sinceSeq ? `?since_seq=${sinceSeq}` : ""}`,
        { signal: AbortSignal.timeout(10_000) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const run      = data.run   as AutopilotRun;
      const newTicks = (data.ticks ?? []) as AutopilotTick[];
      if (newTicks.length > 0) {
        lastSeqRef.current = Math.max(lastSeqRef.current, ...newTicks.map((t) => t.seq));
      }
      setState((s) => ({
        run,
        ticks: reset ? newTicks : mergeTicks(s.ticks, newTicks),
        loading: false,
        error: "",
      }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: extractErrorMsg(e) }));
    }
  }, []);

  // ── Initial load: active run ────────────────────────────────────────────
  const loadActive = useCallback(async () => {
    try {
      const res  = await fetch("/api/engine/autopilot/runs?active=1", { signal: AbortSignal.timeout(10_000) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const run = (data.run ?? null) as AutopilotRun | null;
      if (run) {
        await loadRunDetails(run.id, /* reset */ true);
      } else {
        setState({ run: null, ticks: [], loading: false, error: "" });
      }
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: extractErrorMsg(e) }));
    }
  }, [loadRunDetails]);

  useEffect(() => { void loadActive(); }, [loadActive]);

  // ── Polling (while run is active) ────────────────────────────────────────
  useEffect(() => {
    if (!state.run || !isActive(state.run.status)) {
      if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
      return;
    }
    const runId = state.run.id;
    pollTimerRef.current = setTimeout(() => {
      void loadRunDetails(runId).then(() => emitPipelineRefresh());
    }, AUTOPILOT_POLL_INTERVAL_MS);
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, [state.run, loadRunDetails]);

  // ── Tick-driving loop (client-side) ──────────────────────────────────────
  useEffect(() => {
    // Only drive ticks when: we have a run, status === "running"
    if (!state.run || state.run.status !== "running") return;
    if (tickLoopRef.current) return; // already driving

    const ctrl = new AbortController();
    tickLoopRef.current = ctrl;
    const runId = state.run.id;

    (async () => {
      while (!ctrl.signal.aborted) {
        const tickOk = await fireTick(runId, ctrl.signal);
        if (ctrl.signal.aborted) break;
        if (!tickOk) break;

        // Fetch fresh state right after the tick
        await loadRunDetails(runId);

        // If server moved the run to a terminal/paused state, stop
        const latest = await getLatestRun(runId);
        if (!latest || !isActive(latest.status) || latest.status !== "running") break;

        await sleep(AUTOPILOT_DELAY_BETWEEN_MS, ctrl.signal).catch(() => {});
      }
      tickLoopRef.current = null;
    })();

    return () => {
      ctrl.abort();
      tickLoopRef.current = null;
    };
  }, [state.run, loadRunDetails]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const start = useCallback(async (cfg: StartConfig = {}) => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const res  = await fetch("/api/engine/autopilot/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      lastSeqRef.current = 0;
      await loadRunDetails((data.run as AutopilotRun).id, true);
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: extractErrorMsg(e) }));
    }
  }, [loadRunDetails]);

  const control = useCallback(async (action: "cancel" | "pause" | "resume") => {
    if (!state.run) return;
    try {
      const res  = await fetch("/api/engine/autopilot/control", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ run_id: state.run.id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setState((s) => ({ ...s, run: data.run as AutopilotRun, error: "" }));
    } catch (e) {
      setState((s) => ({ ...s, error: extractErrorMsg(e) }));
    }
  }, [state.run]);

  return {
    run:      state.run,
    ticks:    state.ticks,
    loading:  state.loading,
    error:    state.error,
    start,
    cancel:   () => control("cancel"),
    pause:    () => control("pause"),
    resume:   () => control("resume"),
    reload:   loadActive,
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────

function mergeTicks(existing: AutopilotTick[], incoming: AutopilotTick[]): AutopilotTick[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((t) => t.seq));
  const merged = [...incoming.filter((t) => !seen.has(t.seq)), ...existing];
  merged.sort((a, b) => b.seq - a.seq);
  return merged.slice(0, 200);
}

async function getLatestRun(runId: string): Promise<AutopilotRun | null> {
  try {
    const res = await fetch(`/api/engine/autopilot/runs/${runId}`, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.run ?? null) as AutopilotRun | null;
  } catch { return null; }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    if (signal) signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}

async function fireTick(runId: string, signal: AbortSignal): Promise<boolean> {
  for (let attempt = 0; attempt <= AUTOPILOT_TICK_MAX_RETRIES; attempt++) {
    if (signal.aborted) return false;
    try {
      const res = await fetch("/api/engine/autopilot/tick", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ run_id: runId }),
        signal,
      });
      if (res.status >= 502 && res.status <= 504) {
        if (attempt < AUTOPILOT_TICK_MAX_RETRIES) {
          await sleep(AUTOPILOT_RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt) + Math.random() * 500, signal);
          continue;
        }
        return false;
      }
      // Any other response (even application error) is non-retryable at this layer —
      // the tick endpoint has persisted its tick row already.
      return res.ok;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return false;
      if (attempt < AUTOPILOT_TICK_MAX_RETRIES) {
        await sleep(AUTOPILOT_RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt) + Math.random() * 500, signal).catch(() => {});
        continue;
      }
      return false;
    }
  }
  return false;
}

export { isActive, isTerminal };

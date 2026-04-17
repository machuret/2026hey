"use client";

// ═══════════════════════════════════════════════════════════════════════════
// AutoPilotV2 — DB-backed, refresh-surviving pipeline orchestrator.
//
// State lives server-side (engine_autopilot_runs/ticks). This component
// is a thin view + control surface over that state via useAutopilotRun().
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Rocket, Loader2, ChevronDown, ChevronUp, Clock, DollarSign,
  TrendingUp, Pause, Play, X, Settings, History, ExternalLink,
} from "lucide-react";
import { useAutopilotRun, type StartConfig } from "@/hooks/useAutopilotRun";
import type { AutopilotStage, AutopilotTick, AutopilotRun } from "@/lib/autopilot";
import { usePipelineRefresh } from "../pipelineEvents";

export default function AutoPilotV2() {
  const { run, ticks, error, start, cancel, pause, resume } = useAutopilotRun();
  const [expanded, setExpanded] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});

  // Config (only used when starting a NEW run)
  const [cfg, setCfg] = useState<Required<Pick<StartConfig, "stages" | "batch_size" | "max_ticks">> & { max_cost_usd: number | null }>({
    stages:       ["analyze", "find-dm"],
    batch_size:   10,
    max_ticks:    100,
    max_cost_usd: null,
  });

  // Live elapsed re-render every second
  const [, forceRerender] = useState(0);
  useEffect(() => {
    if (!run || run.status !== "running") return;
    const i = setInterval(() => forceRerender((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [run]);

  // Auto-expand while a run is active
  useEffect(() => {
    if (run && (run.status === "running" || run.status === "paused")) setExpanded(true);
  }, [run?.id, run?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remaining-work counts (same stats endpoint layout uses)
  const refreshStageCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/engine/jobs/stats", { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.stats) setStageCounts(data.stats as Record<string, number>);
    } catch { /* silent */ }
  }, []);
  useEffect(() => { void refreshStageCounts(); }, [refreshStageCounts]);
  usePipelineRefresh(refreshStageCounts);

  const isRunning  = run?.status === "running";
  const isPaused   = run?.status === "paused";
  const isActive   = isRunning || isPaused;

  const onStartClick = useCallback(() => {
    void start({
      stages:       cfg.stages,
      batch_size:   cfg.batch_size,
      max_ticks:    cfg.max_ticks,
      max_cost_usd: cfg.max_cost_usd,
    });
    setConfigOpen(false);
    setExpanded(true);
  }, [cfg, start]);

  // Derived display values
  const pendingTotal    = stageCounts.pending   ?? 0;
  const qualifiedTotal  = stageCounts.qualified ?? 0;
  const enrichedTotal   = stageCounts.enriched  ?? 0;
  const elapsedMs       = run
    ? ((run.finished_at ? new Date(run.finished_at).getTime() : Date.now()) - new Date(run.created_at).getTime())
    : 0;
  const statusLabel     = run ? STATUS_LABELS[run.status] : "Idle";
  const statusColor     = run ? STATUS_COLORS[run.status] : "text-gray-400";

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Top row: error + toggles + primary buttons */}
      <div className="flex items-center gap-3">
        {error && <span className="text-xs text-red-400">⚠ {error}</span>}
        {run && <span className={`text-xs ${statusColor}`}>{statusLabel}</span>}

        {isActive && (
          <button
            onClick={() => setExpanded((x) => !x)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            title="Toggle AutoPilot dashboard"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Details
          </button>
        )}

        <Link
          href="/engine/autopilot"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
          title="Run history"
        >
          <History className="h-3 w-3" />
          History
        </Link>

        {/* Primary action button(s) */}
        {!isActive ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfigOpen((x) => !x)}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
              title="AutoPilot config"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={onStartClick}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-900/30"
            >
              <Rocket className="h-4 w-4" />
              AutoPilot
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                onClick={() => void pause()}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-medium text-white"
                title="Pause run"
              >
                <Pause className="h-3 w-3" /> Pause
              </button>
            )}
            {isPaused && (
              <button
                onClick={() => void resume()}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-medium text-white"
                title="Resume run"
              >
                <Play className="h-3 w-3" /> Resume
              </button>
            )}
            <button
              onClick={() => void cancel()}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-2 text-xs font-medium text-white"
              title="Cancel run"
            >
              {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Config dropdown (before starting) */}
      {configOpen && !isActive && (
        <ConfigPanel cfg={cfg} onChange={setCfg} onClose={() => setConfigOpen(false)} />
      )}

      {/* Dashboard panel (during/after a run) */}
      {expanded && run && (
        <DashboardPanel
          run={run}
          ticks={ticks}
          elapsedMs={elapsedMs}
          pendingTotal={pendingTotal}
          qualifiedTotal={qualifiedTotal}
          enrichedTotal={enrichedTotal}
        />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ConfigPanel({
  cfg, onChange, onClose,
}: {
  cfg: { stages: AutopilotStage[]; batch_size: number; max_ticks: number; max_cost_usd: number | null };
  onChange: (next: typeof cfg) => void;
  onClose: () => void;
}) {
  const toggleStage = (s: AutopilotStage) => {
    const next = cfg.stages.includes(s) ? cfg.stages.filter((x) => x !== s) : [...cfg.stages, s];
    onChange({ ...cfg, stages: next.length > 0 ? next : cfg.stages });
  };
  return (
    <div className="w-[380px] rounded-xl border border-gray-700 bg-gray-900/95 backdrop-blur p-4 shadow-2xl shadow-black/40 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">AutoPilot Config</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Stages</label>
        <div className="mt-1 flex gap-2">
          {(["analyze", "find-dm"] as const).map((s) => (
            <button
              key={s}
              onClick={() => toggleStage(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                cfg.stages.includes(s)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {s === "analyze" ? "Analyze (OpenAI)" : "Find DM (Apollo)"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumField label="Batch size"     value={cfg.batch_size} min={1} max={50}
          onChange={(n) => onChange({ ...cfg, batch_size: n })} />
        <NumField label="Max ticks"      value={cfg.max_ticks}  min={1} max={1000}
          onChange={(n) => onChange({ ...cfg, max_ticks: n })} />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Cost cap (USD)</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="number" step="0.10" min="0"
            placeholder="no cap"
            value={cfg.max_cost_usd ?? ""}
            onChange={(e) => onChange({
              ...cfg,
              max_cost_usd: e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
            })}
            className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-white"
          />
          {cfg.max_cost_usd != null && (
            <button
              onClick={() => onChange({ ...cfg, max_cost_usd: null })}
              className="text-xs text-gray-400 hover:text-white"
            >clear</button>
          )}
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          Run stops when accumulated spend reaches this cap. Leave blank to rely on daily API budget only.
        </p>
      </div>
    </div>
  );
}

function NumField({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || min, min, max))}
        className="mt-1 w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-white"
      />
    </div>
  );
}

function DashboardPanel({
  run, ticks, elapsedMs, pendingTotal, qualifiedTotal, enrichedTotal,
}: {
  run: AutopilotRun; ticks: AutopilotTick[]; elapsedMs: number;
  pendingTotal: number; qualifiedTotal: number; enrichedTotal: number;
}) {
  const remainingWork = pendingTotal + qualifiedTotal;
  const eta = run.processed > 0 && remainingWork > 0 && run.status === "running"
    ? formatDuration(Math.round(elapsedMs / run.processed * remainingWork))
    : null;

  const showStages = run.stages as AutopilotStage[];
  const pctTick = run.max_ticks > 0 ? Math.min(100, Math.round((run.ticks_completed / run.max_ticks) * 100)) : 0;

  return (
    <div className="w-[600px] max-w-[92vw] rounded-xl border border-gray-700 bg-gray-900/95 backdrop-blur p-4 shadow-2xl shadow-black/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">
            Run <Link href={`/engine/autopilot/${run.id}`}
              className="font-mono text-indigo-300 hover:underline inline-flex items-center gap-1">
              {run.id.slice(0, 8)}… <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="text-[10px] text-gray-500">
            Started {new Date(run.created_at).toLocaleTimeString()} ·
            Stages: {showStages.join(", ")} ·
            Batch {run.batch_size}
          </div>
        </div>
        {run.finish_reason && (
          <span className="text-[10px] uppercase tracking-wide text-gray-500">
            {run.finish_reason}
          </span>
        )}
      </div>

      {/* Tick progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Ticks</span>
          <span className="text-gray-500 font-mono">{run.ticks_completed} / {run.max_ticks}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${pctTick}%` }} />
        </div>
      </div>

      {/* Remaining queue */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Pipeline queue</div>
        <div className="space-y-2">
          {showStages.includes("analyze") && (
            <StageBar label="Pending → Analyze" done={run.analyzed} remaining={pendingTotal}
              total={pendingTotal + run.analyzed} color="indigo" />
          )}
          {showStages.includes("find-dm") && (
            <StageBar label="Qualified → Find DM" done={run.dms_found} remaining={qualifiedTotal}
              total={qualifiedTotal + run.dms_found} color="purple" />
          )}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span>Ready to push (enriched)</span>
            <span className="text-emerald-400 font-mono">{enrichedTotal}</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-800" />

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        <Stat icon={<TrendingUp className="h-3 w-3" />} label="Processed" value={String(run.processed)} />
        <Stat icon={<DollarSign className="h-3 w-3" />} label="Spent" value={`$${Number(run.cost_usd).toFixed(4)}`}
          tint={run.max_cost_usd && Number(run.cost_usd) >= run.max_cost_usd * 0.8 ? "amber" : undefined} />
        <Stat icon={<Clock className="h-3 w-3" />} label="Elapsed" value={formatDuration(elapsedMs)} />
        <Stat label="ETA" value={eta ?? "—"} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Analyzed"  value={String(run.analyzed)}  tint="indigo" />
        <Stat label="DMs found" value={String(run.dms_found)} tint="purple" />
        <Stat label="Failures"  value={String(run.failures)}  tint={run.failures > 0 ? "red" : undefined} />
      </div>

      {/* Cost cap progress */}
      {run.max_cost_usd != null && run.max_cost_usd > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Cost cap</span>
            <span className="text-gray-500 font-mono">
              ${Number(run.cost_usd).toFixed(4)} / ${Number(run.max_cost_usd).toFixed(4)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                Number(run.cost_usd) >= Number(run.max_cost_usd) * 0.8 ? "bg-red-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, Math.round(Number(run.cost_usd) / Number(run.max_cost_usd) * 100))}%` }}
            />
          </div>
        </div>
      )}

      <div className="h-px bg-gray-800" />

      {/* Tick log */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
          Recent ticks ({ticks.length})
        </div>
        {ticks.length === 0 ? (
          <div className="text-xs text-gray-600 italic">No ticks yet…</div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
            {ticks.slice(0, 15).map((t) => <LogRow key={t.id} tick={t} />)}
          </div>
        )}
      </div>

      {run.last_error && (
        <div className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2 text-xs text-red-300">
          Last error: {run.last_error}
        </div>
      )}
    </div>
  );
}

function StageBar({ label, done, remaining, total, color }: {
  label: string; done: number; remaining: number; total: number; color: "indigo" | "purple";
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const fillColor = color === "indigo" ? "bg-indigo-500" : "bg-purple-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-500 font-mono">
          {done} done · <span className="text-amber-400">{remaining} left</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
        <div className={`h-full ${fillColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tint }: {
  icon?: React.ReactNode; label: string; value: string;
  tint?: "indigo" | "purple" | "red" | "amber";
}) {
  const tintClass =
    tint === "indigo" ? "text-indigo-300"
    : tint === "purple" ? "text-purple-300"
    : tint === "red" ? "text-red-400"
    : tint === "amber" ? "text-amber-400"
    : "text-gray-200";
  return (
    <div className="rounded-lg bg-gray-800/50 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-500 mb-0.5">
        {icon}{label}
      </div>
      <div className={`text-sm font-mono font-semibold ${tintClass}`}>{value}</div>
    </div>
  );
}

function LogRow({ tick }: { tick: AutopilotTick }) {
  const colorCls =
    tick.status === "ok"           ? "text-emerald-400"
    : tick.status === "retry"      ? "text-amber-400"
    : tick.status === "budget"     ? "text-amber-400"
    : tick.status === "circuit_open" ? "text-amber-400"
    : tick.status === "cost_cap"   ? "text-amber-400"
    : tick.status === "done"       ? "text-emerald-300"
    : "text-red-400";
  const icon =
    tick.status === "ok" || tick.status === "done" ? "✓"
    : tick.status === "retry" ? "↻"
    : tick.status === "budget" || tick.status === "cost_cap" ? "⛔"
    : tick.status === "circuit_open" ? "⚡"
    : "⚠";
  const time = new Date(tick.at).toLocaleTimeString();
  return (
    <div className={`flex gap-2 ${colorCls}`}>
      <span className="text-gray-600 shrink-0">{time}</span>
      <span className="shrink-0 w-4">{icon}</span>
      <span className="shrink-0 w-16 truncate text-gray-400">[{tick.stage}]</span>
      <span className="flex-1 truncate">{tick.message}</span>
      {Number(tick.cost_usd) > 0 && (
        <span className="shrink-0 text-gray-500">${Number(tick.cost_usd).toFixed(4)}</span>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

const STATUS_LABELS: Record<AutopilotRun["status"], string> = {
  running:   "Running…",
  paused:    "Paused",
  completed: "Complete",
  cancelled: "Cancelled",
  failed:    "Failed",
};

const STATUS_COLORS: Record<AutopilotRun["status"], string> = {
  running:   "text-indigo-400",
  paused:    "text-amber-400",
  completed: "text-emerald-400",
  cancelled: "text-gray-400",
  failed:    "text-red-400",
};

"use client";

// ═══════════════════════════════════════════════════════════════════════════
// AutoPilot run detail — full tick log for a single run.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Loader2, Download } from "lucide-react";
import type { AutopilotRun, AutopilotTick } from "@/lib/autopilot";

export default function AutopilotRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [run, setRun] = useState<AutopilotRun | null>(null);
  const [ticks, setTicks] = useState<AutopilotTick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/engine/autopilot/runs/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRun((data.run ?? null) as AutopilotRun | null);
      setTicks((data.ticks ?? []) as AutopilotTick[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [id]);

  // Auto-refresh while run is still active
  useEffect(() => {
    if (!run || (run.status !== "running" && run.status !== "paused")) return;
    const i = setInterval(() => void reload(), 2500);
    return () => clearInterval(i);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.status]);

  const downloadLog = () => {
    const csv = [
      ["seq","at","stage","status","message","processed","successes","failures","cost_usd","duration_ms","error_code"].join(","),
      ...ticks.map((t) => [
        t.seq, t.at, t.stage, t.status, JSON.stringify(t.message), t.processed, t.successes,
        t.failures, t.cost_usd, t.duration_ms ?? "", t.error_code ?? "",
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `autopilot-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !run) {
    return <div className="p-6 text-gray-400"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading run…</div>;
  }
  if (error)  return <div className="p-6 text-red-400">⚠ {error}</div>;
  if (!run)   return <div className="p-6 text-gray-400">Run not found.</div>;

  const started  = new Date(run.created_at);
  const finished = run.finished_at ? new Date(run.finished_at) : null;
  const duration = finished ? finished.getTime() - started.getTime() : Date.now() - started.getTime();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white font-mono">Run {id.slice(0, 8)}…</h1>
            <p className="text-xs text-gray-500">{started.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadLog}
            disabled={ticks.length === 0}
            className="flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs text-gray-300 disabled:opacity-50"
          >
            <Download className="h-3 w-3" /> Export CSV
          </button>
          <button
            onClick={reload}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs text-gray-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Run summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Summary label="Status"    value={run.status} />
        <Summary label="Ticks"     value={`${run.ticks_completed} / ${run.max_ticks}`} />
        <Summary label="Processed" value={String(run.processed)} />
        <Summary label="Cost"      value={`$${Number(run.cost_usd).toFixed(4)}`} />
        <Summary label="Analyzed"  value={String(run.analyzed)} />
        <Summary label="DMs found" value={String(run.dms_found)} />
        <Summary label="Failures"  value={String(run.failures)} />
        <Summary label="Duration"  value={formatDuration(duration)} />
        <Summary label="Stages"    value={run.stages.join(", ")} />
        <Summary label="Batch size" value={String(run.batch_size)} />
        <Summary label="Cost cap"  value={run.max_cost_usd ? `$${Number(run.max_cost_usd).toFixed(2)}` : "—"} />
        <Summary label="Reason"    value={run.finish_reason ?? "—"} />
      </div>

      {run.last_error && (
        <div className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2 text-xs text-red-300">
          Last error: {run.last_error}
        </div>
      )}

      {/* Tick table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead className="bg-gray-900 text-gray-500">
            <tr>
              <th className="text-right px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-left px-3 py-2">Stage</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Message</th>
              <th className="text-right px-3 py-2">Proc.</th>
              <th className="text-right px-3 py-2">OK</th>
              <th className="text-right px-3 py-2">Fail</th>
              <th className="text-right px-3 py-2">$</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {ticks.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-6 text-gray-500">No ticks yet.</td></tr>
            ) : ticks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-900/70 transition-colors">
                <td className="px-3 py-1.5 text-right text-gray-500">{t.seq}</td>
                <td className="px-3 py-1.5 text-gray-400">{new Date(t.at).toLocaleTimeString()}</td>
                <td className="px-3 py-1.5 text-gray-400">{t.stage}</td>
                <td className={`px-3 py-1.5 ${tickStatusColor(t.status)}`}>{t.status}</td>
                <td className="px-3 py-1.5 text-gray-300 max-w-md truncate">{t.message}</td>
                <td className="px-3 py-1.5 text-right text-gray-400">{t.processed}</td>
                <td className="px-3 py-1.5 text-right text-emerald-400">{t.successes}</td>
                <td className="px-3 py-1.5 text-right text-red-400">{t.failures || ""}</td>
                <td className="px-3 py-1.5 text-right text-gray-400">{Number(t.cost_usd) > 0 ? `$${Number(t.cost_usd).toFixed(4)}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <Link href="/engine/autopilot" className="text-sm text-indigo-400 hover:underline">
          ← Back to history
        </Link>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm font-mono text-gray-200 mt-0.5">{value}</div>
    </div>
  );
}

function tickStatusColor(s: string): string {
  switch (s) {
    case "ok": case "done":    return "text-emerald-400";
    case "retry": case "budget": case "cost_cap": case "circuit_open": return "text-amber-400";
    case "fail":               return "text-red-400";
    default: return "text-gray-400";
  }
}

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

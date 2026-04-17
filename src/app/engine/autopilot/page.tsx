"use client";

// ═══════════════════════════════════════════════════════════════════════════
// AutoPilot run history — list of recent runs with status, cost, duration.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import Link from "next/link";
import { Rocket, RefreshCw, Loader2, Zap } from "lucide-react";
import type { AutopilotRun, ApiCircuit } from "@/lib/autopilot";

export default function AutopilotHistoryPage() {
  const [runs, setRuns] = useState<AutopilotRun[]>([]);
  const [circuits, setCircuits] = useState<ApiCircuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = async () => {
    setLoading(true); setError("");
    try {
      const [runsRes, circuitsRes] = await Promise.all([
        fetch("/api/engine/autopilot/runs?limit=50"),
        fetch("/api/engine/autopilot/circuits"),
      ]);
      const runsData     = await runsRes.json();
      const circuitsData = await circuitsRes.json();
      if (!runsRes.ok)     throw new Error(runsData.error     ?? "Failed to load runs");
      if (!circuitsRes.ok) throw new Error(circuitsData.error ?? "Failed to load circuits");
      setRuns((runsData.runs ?? []) as AutopilotRun[]);
      setCircuits((circuitsData.circuits ?? []) as ApiCircuit[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const resetCircuit = async (api: string) => {
    try {
      const res = await fetch("/api/engine/autopilot/circuits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await reload();
    } catch (e) {
      alert(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Rocket className="h-5 w-5 text-amber-400" />
            AutoPilot History
          </h1>
          <p className="text-xs text-gray-500 mt-1">Every run is audited here, forever.</p>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs text-gray-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <div className="text-red-400 text-sm">⚠ {error}</div>}

      {/* Circuit breakers */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">API Circuit Breakers</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {circuits.map((c) => (
            <div key={c.api} className="rounded-lg border border-gray-800 bg-gray-900 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-300">{c.api}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  c.state === "closed"    ? "bg-emerald-900/50 text-emerald-400"
                  : c.state === "open"    ? "bg-red-900/50 text-red-400"
                  : "bg-amber-900/50 text-amber-400"
                }`}>{c.state}</span>
              </div>
              <div className="text-[10px] text-gray-500">
                Consecutive fails: {c.consecutive_fails}
              </div>
              {c.state !== "closed" && (
                <button
                  onClick={() => resetCircuit(c.api)}
                  className="mt-2 text-[10px] text-indigo-300 hover:underline"
                >Reset</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Runs table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2">Started</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Stages</th>
              <th className="text-right px-4 py-2">Ticks</th>
              <th className="text-right px-4 py-2">Processed</th>
              <th className="text-right px-4 py-2">Cost</th>
              <th className="text-left px-4 py-2">Reason</th>
              <th className="text-right px-4 py-2">Duration</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && runs.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
              </td></tr>
            ) : runs.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">No runs yet.</td></tr>
            ) : runs.map((r) => {
              const started  = new Date(r.created_at);
              const finished = r.finished_at ? new Date(r.finished_at) : null;
              const duration = finished
                ? Math.max(0, finished.getTime() - started.getTime())
                : (r.status === "running" ? Date.now() - started.getTime() : 0);
              return (
                <tr key={r.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-2 text-gray-300">{started.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{r.stages.join(", ")}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-300">{r.ticks_completed}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-300">{r.processed}</td>
                  <td className="px-4 py-2 text-right font-mono text-emerald-400">
                    ${Number(r.cost_usd).toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{r.finish_reason ?? "—"}</td>
                  <td className="px-4 py-2 text-right text-gray-400 text-xs">{formatDuration(duration)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/engine/autopilot/${r.id}`}
                      className="text-xs text-indigo-400 hover:underline">View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusColor(s: string): string {
  switch (s) {
    case "running":   return "text-indigo-400";
    case "paused":    return "text-amber-400";
    case "completed": return "text-emerald-400";
    case "cancelled": return "text-gray-400";
    case "failed":    return "text-red-400";
    default:          return "text-gray-300";
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

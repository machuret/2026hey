"use client";

// ═══════════════════════════════════════════════════════════════════════════
// /engine/debug — diagnostic snapshot viewer
//
// One page that answers "where are my jobs and what's happening?"
// Hits /api/engine/debug/snapshot and renders everything.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bug, RefreshCw, Loader2, Download, ExternalLink } from "lucide-react";

interface Snapshot {
  timestamp: string;
  counts: { by_status: Record<string, number>; by_stage: Record<string, number>; total: number };
  recent_jobs: Array<{
    id: string; company_name: string | null; job_title: string | null; status: string; source: string;
    ai_enriched_at: string | null; ai_relevance_score: number | null; ai_poster_type: string | null;
    dm_name: string | null; dm_email: string | null; dm_linkedin_url: string | null; dm_attempts: number | null;
    smartlead_pushed_at: string | null; smartlead_campaign_name: string | null;
    created_at: string; updated_at: string;
  }>;
  stage_transitions: Array<{
    id: string; job_id: string; from_stage: string; to_stage: string; reason: string | null; created_at: string;
  }>;
  api_errors: Array<{
    id: string; api: string; action: string | null; status_code: number | null;
    error_code: string | null; error_message: string | null; cost_usd: number | null; created_at: string;
  }>;
  autopilot_ticks: Array<{
    id: string; run_id: string; seq: number; stage: string; status: string;
    message: string; processed: number; successes: number; failures: number; cost_usd: number; at: string;
  }>;
  notes: Record<string, boolean>;
}

export default function DebugPage() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/engine/debug/snapshot", { signal: AbortSignal.timeout(20_000) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSnap(data as Snapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const downloadJson = () => {
    if (!snap) return;
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `pipeline-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredJobs = snap?.recent_jobs.filter((j) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return [
      j.id, j.company_name, j.job_title, j.status, j.dm_name, j.dm_email,
    ].some((v) => v && v.toLowerCase().includes(s));
  }) ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bug className="h-5 w-5 text-amber-400" /> Pipeline Diagnostic
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {snap ? `Snapshot at ${new Date(snap.timestamp).toLocaleTimeString()}` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadJson} disabled={!snap}
            className="flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs text-gray-300 disabled:opacity-50"
          ><Download className="h-3 w-3" /> Export JSON</button>
          <button
            onClick={reload} disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2 text-sm text-red-300">⚠ {error}</div>
      )}

      {loading && !snap && (
        <div className="text-gray-400 text-sm"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading snapshot…</div>
      )}

      {snap && (
        <>
          {/* Counts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CountCard title="By computed stage" counts={snap.counts.by_stage} palette={stageColor} />
            <CountCard title="By raw DB status"  counts={snap.counts.by_status} palette={statusColor} />
          </div>

          {/* Recent jobs */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-white">
                Recent 50 jobs ({filteredJobs.length})
              </h2>
              <input
                type="text" placeholder="Filter by id / company / DM…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="rounded bg-gray-800 border border-gray-700 px-2 py-1 text-xs text-gray-200 w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-900 text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2">ID</th>
                    <th className="text-left px-3 py-2">Company</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-right px-3 py-2">AI?</th>
                    <th className="text-right px-3 py-2">Score</th>
                    <th className="text-left px-3 py-2">Poster</th>
                    <th className="text-left px-3 py-2">DM</th>
                    <th className="text-right px-3 py-2">DM tries</th>
                    <th className="text-left px-3 py-2">SmartLead</th>
                    <th className="text-left px-3 py-2">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 font-mono">
                  {filteredJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-900/70">
                      <td className="px-3 py-1.5 text-gray-500">{j.id.slice(0, 8)}…</td>
                      <td className="px-3 py-1.5 text-gray-200 max-w-[180px] truncate">{j.company_name ?? "—"}</td>
                      <td className={`px-3 py-1.5 ${statusColor(j.status)}`}>{j.status}</td>
                      <td className="px-3 py-1.5 text-right">{j.ai_enriched_at ? "✓" : ""}</td>
                      <td className="px-3 py-1.5 text-right text-gray-300">{j.ai_relevance_score ?? ""}</td>
                      <td className="px-3 py-1.5 text-gray-400">{j.ai_poster_type ?? ""}</td>
                      <td className="px-3 py-1.5 text-emerald-300 max-w-[120px] truncate">{j.dm_name ?? ""}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500">{j.dm_attempts ?? 0}</td>
                      <td className="px-3 py-1.5 text-purple-300 max-w-[140px] truncate">{j.smartlead_campaign_name ?? ""}</td>
                      <td className="px-3 py-1.5 text-gray-500">{new Date(j.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredJobs.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-4 text-gray-600">No jobs match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stage transitions */}
            <ListSection title={`Stage transitions (${snap.stage_transitions.length})`}
              empty={snap.notes.transitions_ok ? "No recent transitions" : "Table not available"}>
              {snap.stage_transitions.map((t) => (
                <div key={t.id} className="text-[11px] font-mono">
                  <div className="text-gray-500">{new Date(t.created_at).toLocaleTimeString()}</div>
                  <div className="text-gray-300">
                    {t.from_stage} <span className="text-gray-600">→</span> {t.to_stage}
                  </div>
                  <div className="text-gray-600 truncate">job: {t.job_id.slice(0, 8)}… {t.reason ? `· ${t.reason}` : ""}</div>
                </div>
              ))}
            </ListSection>

            {/* API errors */}
            <ListSection title={`API errors (${snap.api_errors.length})`}
              empty={snap.notes.api_usage_ok ? "No recent errors 🎉" : "Table not available"}>
              {snap.api_errors.map((e) => (
                <div key={e.id} className="text-[11px] font-mono">
                  <div className="text-gray-500">{new Date(e.created_at).toLocaleTimeString()}</div>
                  <div className="text-red-400">
                    {e.api} · {e.status_code ?? "—"} {e.error_code ? ` · ${e.error_code}` : ""}
                  </div>
                  <div className="text-gray-500 truncate">{e.error_message ?? ""}</div>
                </div>
              ))}
            </ListSection>

            {/* Autopilot ticks */}
            <ListSection title={`AutoPilot ticks (${snap.autopilot_ticks.length})`}
              empty={snap.notes.autopilot_ok ? "No ticks" : "Table not available"}>
              {snap.autopilot_ticks.map((t) => (
                <div key={t.id} className="text-[11px] font-mono">
                  <div className="text-gray-500">{new Date(t.at).toLocaleTimeString()} · #{t.seq}</div>
                  <div className={tickColor(t.status)}>{t.stage} · {t.status}</div>
                  <div className="text-gray-400 truncate">{t.message}</div>
                  <Link href={`/engine/autopilot/${t.run_id}`} className="text-indigo-400 hover:underline inline-flex items-center gap-1">
                    run {t.run_id.slice(0, 6)}… <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              ))}
            </ListSection>
          </div>
        </>
      )}
    </div>
  );
}

function CountCard({ title, counts, palette }: {
  title: string; counts: Record<string, number>; palette: (key: string) => string;
}) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total   = entries.reduce((sum, [, n]) => sum + n, 0);
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs text-gray-500">Total: <span className="font-mono text-gray-300">{total}</span></span>
      </div>
      {entries.length === 0 ? (
        <div className="text-gray-500 text-xs">No data</div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {entries.map(([k, v]) => (
            <div key={k} className={`rounded-lg bg-gray-800 px-3 py-2 border-l-4 ${palette(k)}`}>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">{k}</div>
              <div className="text-lg font-mono text-white">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListSection({ title, children, empty }: {
  title: string; children: React.ReactNode; empty: string;
}) {
  const count = Array.isArray(children) ? children.length : (children ? 1 : 0);
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-2">
      <h2 className="text-sm font-semibold text-white mb-2">{title}</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {count === 0 ? <div className="text-xs text-gray-500 italic">{empty}</div> : children}
      </div>
    </div>
  );
}

function stageColor(k: string): string {
  if (k === "enriched")    return "border-emerald-500";
  if (k === "qualified")   return "border-indigo-500";
  if (k === "pending")     return "border-gray-600";
  if (k === "dead_end")    return "border-gray-700";
  if (k === "stuck_no_dm") return "border-orange-500";
  if (k === "pushed" || k === "smartleaded") return "border-purple-500";
  if (k === "dismissed")   return "border-red-700";
  return "border-gray-700";
}

function statusColor(k: string): string {
  if (k.startsWith("pushed_"))      return "text-purple-300";
  if (k === "ai_enriched" || k === "dm_enriched" || k === "fully_enriched") return "text-emerald-300";
  if (k === "dismissed" || k === "recruiter_dismissed") return "text-gray-500";
  if (k === "scraped")              return "text-gray-300";
  return "text-gray-400";
}

function tickColor(s: string): string {
  if (s === "ok" || s === "done")      return "text-emerald-400";
  if (s === "fail")                    return "text-red-400";
  if (s === "budget" || s === "cost_cap" || s === "circuit_open" || s === "retry") return "text-amber-400";
  return "text-gray-400";
}

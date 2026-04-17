"use client";

import { useState } from "react";
import { Sparkles, Users, Send, RotateCcw, Loader2, Trash2 } from "lucide-react";
import type { JobLead } from "../types";
import { useEngineAction, type EngineActionResult } from "@/hooks/useEngineAction";
import SmartLeadActions from "./SmartLeadActions";

type Endpoint = "analyze" | "find-dm" | "push-to-crm" | "retry-stuck";

/** Generic action button wrapper */
function ActionButton({
  onClick, disabled, loading, icon: Icon, label, color = "indigo",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color?: "indigo" | "emerald" | "orange" | "red" | "blue";
}) {
  const colors: Record<string, string> = {
    indigo:  "bg-indigo-600 hover:bg-indigo-500",
    emerald: "bg-emerald-600 hover:bg-emerald-500",
    orange:  "bg-orange-600 hover:bg-orange-500",
    red:     "bg-red-600 hover:bg-red-500",
    blue:    "bg-blue-600 hover:bg-blue-500",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-2 rounded-lg ${colors[color]} px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

/** Format a job-endpoint response into a short user-visible summary. */
function formatEndpointSummary(endpoint: Endpoint, data: EngineActionResult): string {
  let summary = "";
  if (endpoint === "analyze") {
    summary = `✓ Analyzed ${data.successes ?? 0}/${data.processed ?? 0}${data.failures ? ` · ${data.failures} failed` : ""}`;
  } else if (endpoint === "find-dm") {
    summary = `✓ DM found: ${data.dm_found ?? 0}/${data.processed ?? 0}${data.dm_not_found ? ` · ${data.dm_not_found} not found` : ""}`;
  } else if (endpoint === "push-to-crm") {
    summary = `✓ Pushed ${data.imported ?? 0} leads${data.skipped ? ` · ${data.skipped} dupes skipped` : ""}`;
  } else if (endpoint === "retry-stuck") {
    summary = `✓ Reset ${data.reset ?? 0} stuck jobs for retry`;
  }
  if (data.costUsd) summary += ` · $${Number(data.costUsd).toFixed(4)}`;
  return summary || "✓ Done";
}

/** Hook for posting to an action endpoint with friendly summary + refresh. */
function useAction(endpoint: Endpoint, refresh: () => void) {
  const action = useEngineAction({
    url: `/api/engine/jobs/${endpoint}`,
    formatSuccess: (data) => formatEndpointSummary(endpoint, data),
    onSuccess: refresh,
  });

  const run = (jobIds: string[]) => {
    if (!jobIds.length) { action.setMsg("Select jobs first"); return; }
    void action.run({ jobIds });
  };

  return { run, loading: action.loading, msg: action.msg };
}

// ── Shared Delete button ───────────────────────────────────────────────────
// Hard-delete selected jobs. Refuses server-side if any are already pushed.
function DeleteButton({ selected, refresh, stageLabel }: {
  selected: Set<string>; refresh: () => void; stageLabel: string;
}) {
  const del = useEngineAction({
    url:    "/api/engine/jobs",
    method: "DELETE",
    formatSuccess: (data) => `✓ Deleted ${data.deleted ?? 0} ${stageLabel} job${(data.deleted ?? 0) === 1 ? "" : "s"}`,
    onSuccess: refresh,
  });
  const ids = Array.from(selected);

  const onClick = () => {
    if (ids.length === 0) { del.setMsg("Select jobs first"); return; }
    const msg = `Permanently delete ${ids.length} ${stageLabel} job${ids.length === 1 ? "" : "s"}? This cannot be undone.`;
    if (!window.confirm(msg)) return;
    void del.run({ jobIds: ids });
  };

  return (
    <>
      <ActionButton
        onClick={onClick}
        disabled={ids.length === 0}
        loading={del.loading}
        icon={Trash2}
        label={`Delete (${ids.length})`}
        color="red"
      />
      <MsgPill msg={del.msg} />
    </>
  );
}

/** Status message pill */
function MsgPill({ msg }: { msg: string }) {
  if (!msg) return null;
  const isError = msg.startsWith("⚠") || msg.startsWith("⛔");
  return (
    <span className={`text-xs ${isError ? "text-red-400" : "text-emerald-400"}`}>
      {msg}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Stage-specific bulk action bars
// ══════════════════════════════════════════════════════════════════════════

const ANALYZE_MAX = 50;
const FIND_DM_MAX = 20;

/** Small warning pill shown when total exceeds the batch cap. */
function OverflowWarning({ total, cap }: { total: number; cap: number }) {
  if (total <= cap) return null;
  return (
    <span className="text-xs text-amber-400">
      ⓘ Only first {cap} of {total} will run — use AutoPilot to process all.
    </span>
  );
}

export function PendingActions({ selected, jobs, refresh }: {
  selected: Set<string>; jobs: JobLead[]; refresh: () => void;
}) {
  const action = useAction("analyze", refresh);
  const selectedIds = Array.from(selected);
  const allIds = jobs.map((j) => j.id);

  return (
    <>
      <ActionButton
        onClick={() => action.run(selectedIds.slice(0, ANALYZE_MAX))}
        disabled={selectedIds.length === 0}
        loading={action.loading}
        icon={Sparkles}
        label={`Analyze Selected (${Math.min(selectedIds.length, ANALYZE_MAX)})`}
        color="indigo"
      />
      <ActionButton
        onClick={() => action.run(allIds.slice(0, ANALYZE_MAX))}
        disabled={allIds.length === 0}
        loading={action.loading}
        icon={Sparkles}
        label={`Analyze All (${Math.min(allIds.length, ANALYZE_MAX)})`}
        color="blue"
      />
      <OverflowWarning total={allIds.length} cap={ANALYZE_MAX} />
      <MsgPill msg={action.msg} />
      <span className="mx-1 h-6 w-px bg-gray-700" aria-hidden />
      <DeleteButton selected={selected} refresh={refresh} stageLabel="pending" />
    </>
  );
}

export function QualifiedActions({ selected, jobs, refresh }: {
  selected: Set<string>; jobs: JobLead[]; refresh: () => void;
}) {
  const action = useAction("find-dm", refresh);
  const selectedIds = Array.from(selected);
  const allIds = jobs.map((j) => j.id);

  return (
    <>
      <ActionButton
        onClick={() => action.run(selectedIds.slice(0, FIND_DM_MAX))}
        disabled={selectedIds.length === 0}
        loading={action.loading}
        icon={Users}
        label={`Find DM (${Math.min(selectedIds.length, FIND_DM_MAX)})`}
        color="emerald"
      />
      <ActionButton
        onClick={() => action.run(allIds.slice(0, FIND_DM_MAX))}
        disabled={allIds.length === 0}
        loading={action.loading}
        icon={Users}
        label={`Find DM All (${Math.min(allIds.length, FIND_DM_MAX)})`}
        color="blue"
      />
      <OverflowWarning total={allIds.length} cap={FIND_DM_MAX} />
      <MsgPill msg={action.msg} />
    </>
  );
}

export function StuckActions({ selected, jobs: _jobs, refresh }: {
  selected: Set<string>; jobs: JobLead[]; refresh: () => void;
}) {
  const action = useAction("retry-stuck", refresh);
  const selectedIds = Array.from(selected);

  return (
    <>
      <ActionButton
        onClick={() => action.run(selectedIds)}
        disabled={selectedIds.length === 0}
        loading={action.loading}
        icon={RotateCcw}
        label={`Reset & Retry (${selectedIds.length})`}
        color="orange"
      />
      <ActionButton
        onClick={() => {
          if (window.confirm("Reset ALL stuck jobs? This will re-queue every job currently in 'stuck_no_dm' for another DM search attempt and may spend API budget.")) {
            action.run([]);
          }
        }}
        loading={action.loading}
        icon={RotateCcw}
        label="Reset ALL Stuck"
        color="red"
      />
      <MsgPill msg={action.msg} />
    </>
  );
}

export function EnrichedActions({ selected, jobs, refresh }: {
  selected: Set<string>; jobs: JobLead[]; refresh: () => void;
}) {
  const push = useAction("push-to-crm", refresh);
  const selectedIds = Array.from(selected);

  return (
    <>
      <ActionButton
        onClick={() => push.run(selectedIds)}
        disabled={selectedIds.length === 0}
        loading={push.loading}
        icon={Send}
        label={`Push to CRM (${selectedIds.length})`}
        color="emerald"
      />
      <MsgPill msg={push.msg} />

      <span className="mx-1 h-6 w-px bg-gray-700" aria-hidden />

      <SmartLeadActions selected={selected} jobs={jobs} refresh={refresh} />

      <span className="mx-1 h-6 w-px bg-gray-700" aria-hidden />

      <DeleteButton selected={selected} refresh={refresh} stageLabel="enriched" />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Simplified 3-tab actions (Scraped / Ready / Sent)
// ══════════════════════════════════════════════════════════════════════════

const ENRICH_MAX = 20; // limited by the smaller of analyze(50)/find-dm(20)

/**
 * ScrapedActions — unified "Enrich" bulk action.
 *
 * Partitions the selection client-side into:
 *   • pending jobs    → POST /analyze  (OpenAI)
 *   • qualified jobs  → POST /find-dm  (Apollo)
 *   • stuck/dead-end  → skipped with warning
 *
 * Runs both stages sequentially. Shows combined summary.
 */
export function ScrapedActions({ selected, jobs, refresh }: {
  selected: Set<string>; jobs: JobLead[]; refresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  const selectedRows = jobs.filter((j) => selected.has(j.id));
  const pendingIds   = selectedRows.filter((j) => !j.ai_enriched_at).map((j) => j.id);
  const qualifiedIds = selectedRows.filter((j) =>
       j.ai_enriched_at
    && !j.dm_name
    && (j.ai_relevance_score ?? 0) >= 6
    && j.ai_poster_type === "internal"
    && (j.dm_attempts ?? 0) < 3,
  ).map((j) => j.id);

  const runEnrich = async (useAll: boolean) => {
    const rows = useAll ? jobs : selectedRows;
    const pIds = rows.filter((j) => !j.ai_enriched_at).map((j) => j.id).slice(0, ANALYZE_MAX);
    const qIds = rows.filter((j) =>
         j.ai_enriched_at
      && !j.dm_name
      && (j.ai_relevance_score ?? 0) >= 6
      && j.ai_poster_type === "internal"
      && (j.dm_attempts ?? 0) < 3,
    ).map((j) => j.id).slice(0, FIND_DM_MAX);

    if (pIds.length === 0 && qIds.length === 0) {
      setMsg("Nothing to enrich in the selection");
      return;
    }

    setLoading(true);
    setMsg("");
    const parts: string[] = [];
    let costUsd = 0;

    // ── Stage 1: Analyze (if any pending) ──────────────────────────────
    if (pIds.length > 0) {
      try {
        const res  = await fetch("/api/engine/jobs/analyze", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ jobIds: pIds }),
          signal:  AbortSignal.timeout(295_000),
        });
        const data = await res.json() as EngineActionResult;
        if (!res.ok || data.error) throw new Error((data.error as string) || `HTTP ${res.status}`);
        parts.push(`analyze ${data.successes ?? 0}/${data.processed ?? 0}`);
        costUsd += Number(data.costUsd ?? 0);
      } catch (e) {
        setLoading(false);
        setMsg(`⚠ Analyze failed: ${e instanceof Error ? e.message : String(e)}`);
        return;
      }
    }

    // ── Stage 2: Find DM (pre-existing qualified) ──────────────────────
    // Note: newly-qualified jobs (from stage 1) are NOT automatically DM'd
    // here — the user clicks Enrich again on the refreshed list. This keeps
    // the flow predictable + honors the per-stage batch caps.
    if (qIds.length > 0) {
      try {
        const res  = await fetch("/api/engine/jobs/find-dm", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ jobIds: qIds }),
          signal:  AbortSignal.timeout(295_000),
        });
        const data = await res.json() as EngineActionResult;
        if (!res.ok || data.error) throw new Error((data.error as string) || `HTTP ${res.status}`);
        parts.push(`DM ${data.dm_found ?? 0}/${data.processed ?? 0}`);
        costUsd += Number(data.costUsd ?? 0);
      } catch (e) {
        setLoading(false);
        setMsg(`⚠ Find DM failed: ${e instanceof Error ? e.message : String(e)}`);
        return;
      }
    }

    setLoading(false);
    setMsg(`✓ ${parts.join(" · ")}${costUsd > 0 ? ` · $${costUsd.toFixed(4)}` : ""}`);
    refresh();
  };

  const selectedCount = pendingIds.length + qualifiedIds.length;
  const allPendingCount   = jobs.filter((j) => !j.ai_enriched_at).length;
  const allQualifiedCount = jobs.filter((j) =>
       j.ai_enriched_at && !j.dm_name
    && (j.ai_relevance_score ?? 0) >= 6 && j.ai_poster_type === "internal"
    && (j.dm_attempts ?? 0) < 3,
  ).length;
  const allCount = Math.min(allPendingCount, ANALYZE_MAX) + Math.min(allQualifiedCount, FIND_DM_MAX);

  return (
    <>
      <ActionButton
        onClick={() => void runEnrich(false)}
        disabled={selectedCount === 0}
        loading={loading}
        icon={Sparkles}
        label={`Enrich Selected (${Math.min(selectedCount, ENRICH_MAX * 2)})`}
        color="indigo"
      />
      <ActionButton
        onClick={() => void runEnrich(true)}
        disabled={allCount === 0}
        loading={loading}
        icon={Sparkles}
        label={`Enrich All (${allCount})`}
        color="blue"
      />
      {(allPendingCount > ANALYZE_MAX || allQualifiedCount > FIND_DM_MAX) && (
        <span className="text-xs text-amber-400">
          ⓘ First {ANALYZE_MAX} pending + {FIND_DM_MAX} qualified per batch — use AutoPilot to process all.
        </span>
      )}
      <MsgPill msg={msg} />
      <span className="mx-1 h-6 w-px bg-gray-700" aria-hidden />
      <DeleteButton selected={selected} refresh={refresh} stageLabel="scraped" />
    </>
  );
}

/**
 * ReadyActions — the "send" tab. SmartLead push is primary. CRM as secondary.
 */
export function ReadyActions({ selected, jobs, refresh }: {
  selected: Set<string>; jobs: JobLead[]; refresh: () => void;
}) {
  const push = useAction("push-to-crm", refresh);
  const ids  = Array.from(selected);

  return (
    <>
      <SmartLeadActions selected={selected} jobs={jobs} refresh={refresh} />

      <span className="mx-1 h-6 w-px bg-gray-700" aria-hidden />

      <ActionButton
        onClick={() => push.run(ids)}
        disabled={ids.length === 0}
        loading={push.loading}
        icon={Send}
        label={`Push to CRM (${ids.length})`}
        color="emerald"
      />
      <MsgPill msg={push.msg} />

      <span className="mx-1 h-6 w-px bg-gray-700" aria-hidden />

      <DeleteButton selected={selected} refresh={refresh} stageLabel="ready" />
    </>
  );
}

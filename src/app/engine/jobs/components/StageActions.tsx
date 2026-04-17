"use client";

import { useState } from "react";
import { Sparkles, Users, Send, RotateCcw, Trash2, Loader2 } from "lucide-react";
import type { JobLead } from "../types";

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

/** Hook for posting to an action endpoint and surfacing result. */
function useAction(endpoint: Endpoint, refresh: () => void) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async (jobIds: string[]) => {
    if (!jobIds.length) { setMsg("Select jobs first"); return; }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/engine/jobs/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds }),
        signal: AbortSignal.timeout(295_000),
      });
      const data = await res.json();

      if (res.status === 429) {
        setMsg(`⛔ Budget hit: ${data.reason ?? data.error}`);
      } else if (!data.success) {
        setMsg(`⚠ ${data.error ?? "Failed"}`);
      } else {
        // Format summary based on endpoint
        let summary = "";
        if (endpoint === "analyze") {
          summary = `✓ Analyzed ${data.successes}/${data.processed}${data.failures ? ` · ${data.failures} failed` : ""}`;
        } else if (endpoint === "find-dm") {
          summary = `✓ DM found: ${data.dm_found}/${data.processed}${data.dm_not_found ? ` · ${data.dm_not_found} not found` : ""}`;
        } else if (endpoint === "push-to-crm") {
          summary = `✓ Pushed ${data.imported ?? 0} leads${data.skipped ? ` · ${data.skipped} dupes skipped` : ""}`;
        } else if (endpoint === "retry-stuck") {
          summary = `✓ Reset ${data.reset} stuck jobs for retry`;
        }
        if (data.costUsd) summary += ` · $${Number(data.costUsd).toFixed(4)}`;
        setMsg(summary);
        refresh();
      }
    } catch (e) {
      setMsg(`⚠ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, msg };
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

export function PendingActions({ selected, jobs, refresh }: {
  selected: Set<string>; jobs: JobLead[]; refresh: () => void;
}) {
  const action = useAction("analyze", refresh);
  const selectedIds = Array.from(selected);
  const allIds = jobs.map((j) => j.id);

  return (
    <>
      <ActionButton
        onClick={() => action.run(selectedIds)}
        disabled={selectedIds.length === 0}
        loading={action.loading}
        icon={Sparkles}
        label={`Analyze Selected (${selectedIds.length})`}
        color="indigo"
      />
      <ActionButton
        onClick={() => action.run(allIds.slice(0, 50))}
        disabled={allIds.length === 0}
        loading={action.loading}
        icon={Sparkles}
        label={`Analyze All (max 50)`}
        color="blue"
      />
      <MsgPill msg={action.msg} />
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
        onClick={() => action.run(selectedIds)}
        disabled={selectedIds.length === 0}
        loading={action.loading}
        icon={Users}
        label={`Find DM (${selectedIds.length})`}
        color="emerald"
      />
      <ActionButton
        onClick={() => action.run(allIds.slice(0, 20))}
        disabled={allIds.length === 0}
        loading={action.loading}
        icon={Users}
        label={`Find DM for All (max 20)`}
        color="blue"
      />
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
        onClick={() => action.run([])}
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
    </>
  );
}

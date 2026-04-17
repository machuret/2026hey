"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send, RefreshCw } from "lucide-react";
import type { JobLead } from "../types";
import { emitPipelineRefresh } from "../pipelineEvents";

type Campaign = {
  id: number | string;
  name: string;
  status?: string;
};

type PushResult = {
  success: boolean;
  uploaded?: number;
  duplicates?: number;
  invalid?: number;
  skipped_no_email?: number;
  errors?: string[];
  error?: string;
};

export default function SmartLeadActions({
  selected, jobs, refresh,
}: {
  selected: Set<string>;
  jobs: JobLead[];
  refresh: () => void;
}) {
  const [campaigns, setCampaigns]     = useState<Campaign[]>([]);
  const [campaignId, setCampaignId]   = useState<string>("");
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignsError, setCampaignsError]     = useState("");

  const [pushing, setPushing] = useState(false);
  const [msg, setMsg]         = useState("");

  const selectedIds = Array.from(selected);

  // Preview: how many of the selected jobs actually have an email
  const selectedWithEmail = jobs
    .filter((j) => selected.has(j.id))
    .filter((j) => j.dm_email || (j.emails && j.emails.some((e) => e && e.includes("@"))))
    .length;

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    setCampaignsError("");
    try {
      const res = await fetch("/api/engine/smartlead?action=campaigns", {
        signal: AbortSignal.timeout(15_000),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCampaignsError(data.error ?? "Failed to load campaigns");
        return;
      }
      const list = (data.campaigns ?? []) as Campaign[];
      setCampaigns(list);
      if (list.length > 0 && !campaignId) setCampaignId(String(list[0].id));
    } catch (e) {
      setCampaignsError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingCampaigns(false);
    }
  }, [campaignId]);

  useEffect(() => { loadCampaigns(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const push = async () => {
    if (!selectedIds.length) { setMsg("Select jobs first"); return; }
    if (!campaignId)         { setMsg("Pick a campaign");   return; }

    const campaignName = campaigns.find((c) => String(c.id) === campaignId)?.name;
    setPushing(true);
    setMsg("");
    try {
      const res = await fetch("/api/engine/smartlead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: selectedIds, campaignId, campaignName }),
        signal: AbortSignal.timeout(285_000),
      });
      const data = (await res.json()) as PushResult;
      if (!res.ok || data.error) {
        setMsg(`⚠ ${data.error ?? `HTTP ${res.status}`}`);
        return;
      }
      const parts = [
        `✓ Pushed ${data.uploaded ?? 0} to SmartLead`,
        data.duplicates ? `${data.duplicates} dupes` : "",
        data.invalid ? `${data.invalid} invalid` : "",
        data.skipped_no_email ? `${data.skipped_no_email} no-email skipped` : "",
      ].filter(Boolean);
      setMsg(parts.join(" · "));
      refresh();
      emitPipelineRefresh();
    } catch (e) {
      setMsg(`⚠ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPushing(false);
    }
  };

  const isError = msg.startsWith("⚠");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          disabled={loadingCampaigns || campaigns.length === 0}
          className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-200 disabled:opacity-50 min-w-[200px]"
        >
          {campaigns.length === 0 && (
            <option value="">
              {loadingCampaigns ? "Loading campaigns…" : "No campaigns"}
            </option>
          )}
          {campaigns.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}{c.status ? ` (${c.status})` : ""}
            </option>
          ))}
        </select>
        <button
          onClick={loadCampaigns}
          disabled={loadingCampaigns}
          title="Reload campaigns"
          className="rounded-lg bg-gray-800 hover:bg-gray-700 p-2 text-gray-300 disabled:opacity-50"
        >
          {loadingCampaigns
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      <button
        onClick={push}
        disabled={pushing || selectedIds.length === 0 || !campaignId}
        className="flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Push to SmartLead ({selectedWithEmail}
        {selectedWithEmail !== selectedIds.length ? `/${selectedIds.length}` : ""})
      </button>

      {campaignsError && (
        <span className="text-xs text-red-400">⚠ {campaignsError}</span>
      )}
      {msg && (
        <span className={`text-xs ${isError ? "text-red-400" : "text-emerald-400"}`}>
          {msg}
        </span>
      )}
      {selectedIds.length > 0 && selectedWithEmail < selectedIds.length && !msg && (
        <span className="text-xs text-amber-400">
          ⓘ {selectedIds.length - selectedWithEmail} selected have no email and will be skipped
        </span>
      )}
    </div>
  );
}

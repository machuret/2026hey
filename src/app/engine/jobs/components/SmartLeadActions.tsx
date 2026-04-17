"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SmartLeadActions — campaign picker + "Push to SmartLead" bulk action.
//
// Uses:
//   - useSmartLeadCampaigns() — loads campaigns from /api/engine/smartlead
//   - useEngineAction()       — generic POST action with loading/error/msg state
//   - jobToSmartLead helpers  — consistent email/phone selection (same as API)
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Loader2, Send, RefreshCw } from "lucide-react";
import type { JobLead } from "../types";
import { useSmartLeadCampaigns } from "@/hooks/useSmartLeadCampaigns";
import { useEngineAction } from "@/hooks/useEngineAction";
import { bestEmail } from "@/lib/smartlead";

type Props = {
  selected: Set<string>;
  jobs:     JobLead[];
  refresh:  () => void;
};

export default function SmartLeadActions({ selected, jobs, refresh }: Props) {
  const { campaigns, loading: loadingCampaigns, error: campaignsError, reload } = useSmartLeadCampaigns();
  const [campaignId, setCampaignId] = useState<string>("");

  // Keep the selected campaign pinned to a valid id once campaigns load.
  const effectiveCampaignId = useMemo(() => {
    if (campaignId && campaigns.some((c) => String(c.id) === campaignId)) return campaignId;
    return campaigns[0] ? String(campaigns[0].id) : "";
  }, [campaignId, campaigns]);

  // Count selected jobs that have a valid email.
  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedWithEmail = useMemo(
    () => jobs.filter((j) => selected.has(j.id)).filter((j) => bestEmail(j) !== null).length,
    [jobs, selected],
  );

  const push = useEngineAction({
    url: "/api/engine/smartlead",
    timeoutMs: 285_000,
    formatSuccess: (data) => {
      const parts = [
        `✓ Pushed ${data.uploaded ?? 0} to SmartLead`,
        data.duplicates ? `${data.duplicates} dupes` : "",
        data.invalid ? `${data.invalid} invalid` : "",
        data.skipped_no_email ? `${data.skipped_no_email} no-email skipped` : "",
        data.partial_success ? "(partial — some batches failed)" : "",
        data.db_sync_failed ? "⚠ DB out of sync" : "",
      ].filter(Boolean);
      return parts.join(" · ");
    },
    onSuccess: () => refresh(),
  });

  const onPush = () => {
    if (!selectedIds.length) { push.setMsg("Select jobs first"); return; }
    if (!effectiveCampaignId) { push.setMsg("Pick a campaign"); return; }
    const campaignName = campaigns.find((c) => String(c.id) === effectiveCampaignId)?.name;
    void push.run({ jobIds: selectedIds, campaignId: effectiveCampaignId, campaignName });
  };

  const isError = push.msg.startsWith("⚠") || push.msg.startsWith("⛔");
  const overflow = selectedIds.length - selectedWithEmail;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <select
          value={effectiveCampaignId}
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
          onClick={() => void reload()}
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
        onClick={onPush}
        disabled={push.loading || selectedIds.length === 0 || !effectiveCampaignId}
        className="flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {push.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Push to SmartLead ({selectedWithEmail}{overflow > 0 ? `/${selectedIds.length}` : ""})
      </button>

      {campaignsError && (
        <span className="text-xs text-red-400">⚠ {campaignsError}</span>
      )}
      {push.msg && (
        <span className={`text-xs ${isError ? "text-red-400" : "text-emerald-400"}`}>
          {push.msg}
        </span>
      )}
      {overflow > 0 && !push.msg && (
        <span className="text-xs text-amber-400">
          ⓘ {overflow} selected have no email and will be skipped
        </span>
      )}
    </div>
  );
}

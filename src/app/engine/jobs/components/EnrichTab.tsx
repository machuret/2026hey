"use client";

import { Brain, UserSearch, Linkedin, Loader2, RefreshCw, DollarSign, CheckCircle } from "lucide-react";
import type { JobLead, EnrichMethod } from "../types";
import JobsTable from "./JobsTable";

type Props = {
  jobs: JobLead[];
  selected: Set<string>;
  selectedCount: number;
  loading: boolean;
  enriching: boolean;
  enrichMethod: EnrichMethod | null;
  enrichError: string;
  enrichCount: number;
  enrichCost: number | null;
  enrichSaveMsg: string;
  toggle: (id: string) => void;
  toggleAll: (jobs: JobLead[]) => void;
  onViewDetail: (job: JobLead) => void;
  onRefresh: () => void;
  onEnrich: (method: EnrichMethod, ids: Set<string>) => void;
};

export default function EnrichTab({
  jobs, selected, selectedCount, loading,
  enriching, enrichMethod, enrichError, enrichCount, enrichCost, enrichSaveMsg,
  toggle, toggleAll, onViewDetail, onRefresh, onEnrich,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <div className="h-6 border-l border-gray-700" />

        <span className="text-xs text-gray-500">
          {selectedCount} selected
        </span>

        <button
          onClick={() => onEnrich("ai", selected)}
          disabled={enriching || !selectedCount}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {enriching && enrichMethod === "ai" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          AI Analyze
        </button>

        <button
          onClick={() => onEnrich("apollo", selected)}
          disabled={enriching || !selectedCount}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {enriching && enrichMethod === "apollo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserSearch className="h-4 w-4" />}
          Find Decision Makers
        </button>

        <button
          onClick={() => onEnrich("linkedin", selected)}
          disabled={enriching || !selectedCount}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {enriching && enrichMethod === "linkedin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-4 w-4" />}
          LinkedIn Intel
        </button>

        {enrichCount > 0 && (
          <span className="text-xs text-emerald-400">
            {enrichCount} enriched
          </span>
        )}

        {enrichCost != null && enrichCost > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
            <DollarSign className="h-3 w-3" />
            Cost: ${enrichCost.toFixed(4)}
          </span>
        )}
      </div>

      {enrichError && <p className="text-sm text-red-400">{enrichError}</p>}

      {enrichSaveMsg && (
        <p className="inline-flex items-center gap-1 text-xs text-emerald-400">
          <CheckCircle className="h-3 w-3" /> {enrichSaveMsg}
        </p>
      )}

      <JobsTable
        jobs={jobs}
        selected={selected}
        toggle={toggle}
        toggleAll={toggleAll}
        onViewDetail={onViewDetail}
      />
    </div>
  );
}

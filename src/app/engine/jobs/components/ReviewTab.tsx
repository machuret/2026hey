"use client";

import { ArrowRightCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import type { JobLead } from "../types";
import JobsTable from "./JobsTable";

type Props = {
  jobs: JobLead[];
  selected: Set<string>;
  selectedCount: number;
  loading: boolean;
  pushing: boolean;
  pushResult: string;
  toggle: (id: string) => void;
  toggleAll: (jobs: JobLead[]) => void;
  onViewDetail: (job: JobLead) => void;
  onRefresh: () => void;
  onPush: (ids: Set<string>) => void;
  onDismiss: (ids: Set<string>) => void;
};

export default function ReviewTab({
  jobs, selected, selectedCount, loading,
  pushing, pushResult,
  toggle, toggleAll, onViewDetail, onRefresh, onPush, onDismiss,
}: Props) {
  return (
    <div className="space-y-4">
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
          onClick={() => onPush(selected)}
          disabled={pushing || !selectedCount}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightCircle className="h-4 w-4" />}
          Push to CRM
        </button>

        <button
          onClick={() => onDismiss(selected)}
          disabled={!selectedCount}
          className="flex items-center gap-2 rounded-lg bg-red-900/50 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <XCircle className="h-4 w-4" />
          Dismiss
        </button>

        {pushResult && (
          <span className={`text-xs ${pushResult.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
            {pushResult}
          </span>
        )}
      </div>

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

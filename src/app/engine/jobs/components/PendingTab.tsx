"use client";

import { RefreshCw, Clock } from "lucide-react";
import type { JobLead } from "../types";
import JobsTable from "./JobsTable";

type Props = {
  jobs: JobLead[];
  selected: Set<string>;
  selectedCount: number;
  loading: boolean;
  toggle: (id: string) => void;
  toggleAll: (jobs: JobLead[]) => void;
  onViewDetail: (job: JobLead) => void;
  onRefresh: () => void;
};

/** Filter to only "new" jobs — scraped but not yet enriched */
function filterPending(jobs: JobLead[]): JobLead[] {
  return jobs.filter((j) => j.status === "new");
}

export default function PendingTab({
  jobs, selected, selectedCount, loading,
  toggle, toggleAll, onViewDetail, onRefresh,
}: Props) {
  const pending = filterPending(jobs);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <div className="h-6 border-l border-gray-700" />

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-amber-400">
            <Clock className="h-3 w-3" />
            {pending.length} pending (not enriched)
          </span>
        </div>

        {selectedCount > 0 && (
          <span className="text-xs text-gray-500">{selectedCount} selected</span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No pending jobs. Scrape some jobs first, then save them to the database.</p>
        </div>
      ) : (
        <JobsTable
          jobs={pending}
          selected={selected}
          toggle={toggle}
          toggleAll={toggleAll}
          onViewDetail={onViewDetail}
        />
      )}
    </div>
  );
}

"use client";

// ═══════════════════════════════════════════════════════════════════════════
// StagePage — reusable template for any pipeline stage page.
// Handles: fetch on mount, loading/error, pagination, stage-specific columns.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useMemo, useCallback } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import type { JobLead } from "../types";
import type { TableColumn } from "../tableColumns";
import { useJobList, useJobPipelineState } from "@/hooks/useJobPipeline";
import JobsTableV2 from "./JobsTableV2";
import JobDetailDrawer from "./JobDetailDrawer";
import { usePipelineRefresh } from "../pipelineEvents";

const PAGE_SIZE = 50;

type Props = {
  stage: string;
  title: string;
  description: string;
  columns: TableColumn[];
  /** Render bulk-action buttons (e.g. "Enrich Selected") */
  bulkActions?: (selected: Set<string>, jobs: JobLead[], refresh: () => void) => React.ReactNode;
  /** Render per-row action buttons */
  rowActions?: (job: JobLead, refresh: () => void) => React.ReactNode;
  emptyMessage?: string;
  /** Additional filters to apply on top of stage */
  additionalFilters?: { status?: string };
};

export default function StagePage({
  stage, title, description, columns,
  bulkActions, rowActions, emptyMessage, additionalFilters,
}: Props) {
  const { jobs, loading, count, listError, fetchJobs } = useJobList();
  const { selected, setSelected, toggleAll, toggle } = useJobPipelineState();
  const [detailJob, setDetailJob] = useState<JobLead | null>(null);
  const [page, setPage] = useState(0);

  const refresh = useCallback(() => {
    fetchJobs({ stage, ...additionalFilters });
    setSelected(new Set());
  }, [fetchJobs, stage, additionalFilters, setSelected]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Auto-refresh whenever any other part of the app triggers a pipeline refresh.
  usePipelineRefresh(refresh);

  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageJobs = useMemo(
    () => jobs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [jobs, safePage],
  );

  return (
    <div className="space-y-4">
      {/* Stage header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {count} total · {selected.size} selected
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {bulkActions && jobs.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {bulkActions(selected, jobs, refresh)}
        </div>
      )}

      {listError && <p className="text-xs text-red-400">{listError}</p>}

      <JobsTableV2
        jobs={pageJobs}
        columns={columns}
        selected={selected}
        toggle={toggle}
        toggleAll={toggleAll}
        onViewDetail={setDetailJob}
        emptyMessage={emptyMessage ?? `No jobs in ${title.toLowerCase()} stage yet.`}
        rowActions={rowActions ? (j) => rowActions(j, refresh) : undefined}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, jobs.length)} of {jobs.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Prev
            </button>
            <span className="text-xs text-gray-400">{safePage + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <JobDetailDrawer job={detailJob} onClose={() => setDetailJob(null)} />
    </div>
  );
}

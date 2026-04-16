"use client";

import { useState, useMemo } from "react";
import { RefreshCw, CheckCircle, Star, Users, ChevronLeft, ChevronRight } from "lucide-react";
import type { JobLead } from "../types";
import JobsTable from "./JobsTable";

const PAGE_SIZE = 50;

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

/** Only show jobs that have been enriched (ai, dm, or fully enriched) */
function filterEnriched(jobs: JobLead[]): JobLead[] {
  const enrichedStatuses = new Set(["ai_enriched", "dm_enriched", "fully_enriched"]);
  return jobs.filter((j) => enrichedStatuses.has(j.status) || j.ai_enriched_at != null);
}

export default function EnrichedTab({
  jobs, selected, selectedCount, loading,
  toggle, toggleAll, onViewDetail, onRefresh,
}: Props) {
  const enriched = filterEnriched(jobs);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(enriched.length / PAGE_SIZE));
  // Reset page if out of bounds (e.g. after refresh reduces total)
  const safePage = Math.min(page, totalPages - 1);

  const pageJobs = useMemo(
    () => enriched.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [enriched, safePage],
  );

  const fullyCount = enriched.filter((j) => j.status === "fully_enriched").length;
  const withDm = enriched.filter((j) => j.dm_name).length;
  const avgScore = enriched.length
    ? Math.round(
        (enriched.reduce((sum, j) => sum + (j.ai_relevance_score ?? 0), 0) / enriched.length) * 10,
      ) / 10
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
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
          <span className="flex items-center gap-1 text-indigo-400">
            <CheckCircle className="h-3 w-3" />
            {enriched.length} enriched
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Users className="h-3 w-3" />
            {withDm} with DM
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <CheckCircle className="h-3 w-3" />
            {fullyCount} fully enriched
          </span>
          {avgScore > 0 && (
            <span className="flex items-center gap-1 text-yellow-400">
              <Star className="h-3 w-3" />
              Avg score: {avgScore}/10
            </span>
          )}
        </div>

        {selectedCount > 0 && (
          <span className="text-xs text-gray-500">{selectedCount} selected</span>
        )}
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No enriched jobs yet. Go to Enrich tab to start.</p>
        </div>
      ) : (
        <>
          <JobsTable
            jobs={pageJobs}
            selected={selected}
            toggle={toggle}
            toggleAll={toggleAll}
            onViewDetail={onViewDetail}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500">
                Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, enriched.length)} of {enriched.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" /> Prev
                </button>
                <span className="text-xs text-gray-400">
                  {safePage + 1} / {totalPages}
                </span>
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
        </>
      )}
    </div>
  );
}

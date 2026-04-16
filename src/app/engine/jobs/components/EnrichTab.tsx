"use client";

import {
  Zap, Brain, UserSearch, Linkedin, Loader2, RefreshCw,
  DollarSign, CheckCircle, Check,
} from "lucide-react";
import type { JobLead, EnrichMethod } from "../types";
import type { EnrichStep } from "@/hooks/useJobPipeline";
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
  pipelineSteps: EnrichStep[];
  pipelineProgress: number;
  pipelineBatchMsg: string;
  toggle: (id: string) => void;
  toggleAll: (jobs: JobLead[]) => void;
  onViewDetail: (job: JobLead) => void;
  onRefresh: () => void;
  onEnrich: (method: EnrichMethod, ids: Set<string>) => void;
  onEnrichAll: (ids: Set<string>) => void;
};

const STEP_ICONS: Record<EnrichMethod, React.ReactNode> = {
  ai:       <Brain className="h-3.5 w-3.5" />,
  apollo:   <UserSearch className="h-3.5 w-3.5" />,
  linkedin: <Linkedin className="h-3.5 w-3.5" />,
};

export default function EnrichTab({
  jobs, selected, selectedCount, loading,
  enriching, enrichMethod, enrichError, enrichCount, enrichCost, enrichSaveMsg,
  pipelineSteps, pipelineProgress, pipelineBatchMsg,
  toggle, toggleAll, onViewDetail, onRefresh, onEnrich, onEnrichAll,
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

        {/* Primary: Enrich All (full pipeline) */}
        <button
          onClick={() => onEnrichAll(selected)}
          disabled={enriching || !selectedCount}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-900/30"
        >
          {enriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {enriching ? "Enriching…" : "Enrich All"}
        </button>

        {/* Individual steps (secondary) */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600 mr-1">or:</span>
          <button
            onClick={() => onEnrich("ai", selected)}
            disabled={enriching || !selectedCount}
            className="flex items-center gap-1.5 rounded-lg bg-blue-900/40 px-3 py-1.5 text-xs font-medium text-blue-300 border border-blue-800/40 hover:bg-blue-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {enriching && enrichMethod === "ai" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
            AI
          </button>
          <button
            onClick={() => onEnrich("apollo", selected)}
            disabled={enriching || !selectedCount}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-900/40 px-3 py-1.5 text-xs font-medium text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {enriching && enrichMethod === "apollo" ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserSearch className="h-3 w-3" />}
            DMs
          </button>
          <button
            onClick={() => onEnrich("linkedin", selected)}
            disabled={enriching || !selectedCount}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-900/40 px-3 py-1.5 text-xs font-medium text-indigo-300 border border-indigo-800/40 hover:bg-indigo-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {enriching && enrichMethod === "linkedin" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Linkedin className="h-3 w-3" />}
            LinkedIn
          </button>
        </div>

        {enrichCount > 0 && !enriching && (
          <span className="text-xs text-emerald-400">{enrichCount} enriched</span>
        )}

        {enrichCost != null && enrichCost > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
            <DollarSign className="h-3 w-3" />
            ${enrichCost.toFixed(4)}
          </span>
        )}
      </div>

      {/* Pipeline progress panel */}
      {enriching && (
        <div className="rounded-lg bg-gray-900/70 border border-gray-800 p-4 space-y-3">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${pipelineProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-400 w-10 text-right">{pipelineProgress}%</span>
          </div>

          {pipelineBatchMsg && (
            <p className="text-xs text-gray-400">{pipelineBatchMsg}</p>
          )}

          {/* Pipeline step indicators */}
          {pipelineSteps.length > 0 && (
            <div className="flex items-center gap-4">
              {pipelineSteps.map((step, i) => (
                <div key={step.method} className="flex items-center gap-1.5">
                  <span className={`flex items-center justify-center h-5 w-5 rounded-full text-xs ${
                    step.done
                      ? "bg-emerald-900/50 text-emerald-400"
                      : enrichMethod === step.method
                        ? "bg-indigo-900/50 text-indigo-300 animate-pulse"
                        : "bg-gray-800 text-gray-500"
                  }`}>
                    {step.done ? <Check className="h-3 w-3" /> : STEP_ICONS[step.method]}
                  </span>
                  <span className={`text-xs ${step.done ? "text-emerald-400" : enrichMethod === step.method ? "text-white" : "text-gray-500"}`}>
                    {step.label}
                    {step.done && step.count > 0 && <span className="ml-1 text-gray-500">({step.count})</span>}
                  </span>
                  {i < pipelineSteps.length - 1 && (
                    <span className="text-gray-700 mx-1">→</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

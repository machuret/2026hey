"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, UserSearch, Linkedin, ArrowRightCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import type { JobLead, JobPipelineTab, EnrichMethod } from "./types";
import {
  useJobScrape, useJobList, useJobEnrich,
  useJobPushToCrm, useJobPipelineState,
} from "@/hooks/useJobPipeline";
import JobSearchForm from "./components/JobSearchForm";
import JobsTable from "./components/JobsTable";
import JobDetailDrawer from "./components/JobDetailDrawer";

const TABS: { id: JobPipelineTab; label: string }[] = [
  { id: "scrape", label: "1. Scrape" },
  { id: "enrich", label: "2. Enrich" },
  { id: "review", label: "3. Review & Push" },
];

export default function JobsPage() {
  const { tab, setTab, selected, setSelected, toggleAll, toggle } = useJobPipelineState();
  const { jobs, setJobs, loading, count, listError, fetchJobs } = useJobList();
  const [detailJob, setDetailJob] = useState<JobLead | null>(null);

  // Scrape hook — on done, merge scraped jobs into list
  const onScrapeDone = useCallback((scraped: JobLead[]) => {
    setJobs((prev: JobLead[]) => {
      const existingIds = new Set(prev.map((j: JobLead) => j.source_id));
      const newOnes = scraped.filter((j: JobLead) => !existingIds.has(j.source_id));
      return [...newOnes, ...prev];
    });
  }, [setJobs]);

  const {
    form, setSource, updateForm, selectedSource,
    scraping, scrapeError, saveMsg, scrape,
  } = useJobScrape(onScrapeDone);

  const { enriching, enrichMethod, enrichError, enrichCount, enrich } = useJobEnrich(jobs, setJobs);
  const { pushing, pushResult, pushToCrm, dismiss } = useJobPushToCrm(setJobs);

  // Load saved jobs when switching to Enrich or Review tabs
  useEffect(() => {
    if (tab !== "scrape") fetchJobs();
  }, [tab, fetchJobs]);

  const selectedCount = selected.size;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Job Scraper</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Scrape Seek, Indeed & LinkedIn jobs → Find decision makers → Push to CRM
            </p>
          </div>
          {count > 0 && (
            <span className="text-xs text-gray-500">{count} jobs in database</span>
          )}
        </div>

        {/* Tab strip */}
        <div className="flex gap-1 mt-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelected(new Set()); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {listError && <p className="text-sm text-red-400">{listError}</p>}

      {/* ═══ TAB: SCRAPE ═══ */}
      {tab === "scrape" && (
        <div className="space-y-6">
          <JobSearchForm
            form={form}
            selectedSource={selectedSource}
            scraping={scraping}
            scrapeError={scrapeError}
            saveMsg={saveMsg}
            setSource={setSource}
            updateForm={updateForm}
            onScrape={scrape}
          />

          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">
                Scraped Results ({jobs.length})
              </h3>
            </div>
            <JobsTable
              jobs={jobs}
              selected={selected}
              toggle={toggle}
              toggleAll={toggleAll}
              onViewDetail={setDetailJob}
            />
          </div>
        </div>
      )}

      {/* ═══ TAB: ENRICH ═══ */}
      {tab === "enrich" && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchJobs()}
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
              onClick={() => enrich("ai", selected)}
              disabled={enriching || !selectedCount}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {enriching && enrichMethod === "ai" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              AI Analyze
            </button>

            <button
              onClick={() => enrich("apollo", selected)}
              disabled={enriching || !selectedCount}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {enriching && enrichMethod === "apollo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserSearch className="h-4 w-4" />}
              Find Decision Makers
            </button>

            <button
              onClick={() => enrich("linkedin", selected)}
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
          </div>

          {enrichError && <p className="text-sm text-red-400">{enrichError}</p>}

          <JobsTable
            jobs={jobs}
            selected={selected}
            toggle={toggle}
            toggleAll={toggleAll}
            onViewDetail={setDetailJob}
          />
        </div>
      )}

      {/* ═══ TAB: REVIEW & PUSH ═══ */}
      {tab === "review" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchJobs()}
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
              onClick={() => pushToCrm(selected)}
              disabled={pushing || !selectedCount}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightCircle className="h-4 w-4" />}
              Push to CRM
            </button>

            <button
              onClick={() => dismiss(selected)}
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
            onViewDetail={setDetailJob}
          />
        </div>
      )}

      </div>

      {/* Detail drawer */}
      <JobDetailDrawer job={detailJob} onClose={() => setDetailJob(null)} />
    </div>
  );
}

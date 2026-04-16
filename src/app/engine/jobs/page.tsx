"use client";

import { useState, useEffect, useCallback } from "react";
import type { JobLead, JobPipelineTab } from "./types";
import {
  useJobScrape, useJobList, useJobEnrich,
  useJobPushToCrm, useJobPipelineState,
} from "@/hooks/useJobPipeline";
import ScrapeTab from "./components/ScrapeTab";
import EnrichTab from "./components/EnrichTab";
import ReviewTab from "./components/ReviewTab";
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

  useEffect(() => {
    if (tab !== "scrape") fetchJobs();
  }, [tab, fetchJobs]);

  const selectedCount = selected.size;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
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

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {listError && <p className="text-sm text-red-400">{listError}</p>}

        {tab === "scrape" && (
          <ScrapeTab
            form={form} selectedSource={selectedSource}
            scraping={scraping} scrapeError={scrapeError} saveMsg={saveMsg}
            setSource={setSource} updateForm={updateForm} onScrape={scrape}
            jobs={jobs} selected={selected}
            toggle={toggle} toggleAll={toggleAll} onViewDetail={setDetailJob}
          />
        )}

        {tab === "enrich" && (
          <EnrichTab
            jobs={jobs} selected={selected} selectedCount={selectedCount}
            loading={loading} enriching={enriching} enrichMethod={enrichMethod}
            enrichError={enrichError} enrichCount={enrichCount}
            toggle={toggle} toggleAll={toggleAll} onViewDetail={setDetailJob}
            onRefresh={fetchJobs} onEnrich={enrich}
          />
        )}

        {tab === "review" && (
          <ReviewTab
            jobs={jobs} selected={selected} selectedCount={selectedCount}
            loading={loading} pushing={pushing} pushResult={pushResult}
            toggle={toggle} toggleAll={toggleAll} onViewDetail={setDetailJob}
            onRefresh={fetchJobs} onPush={pushToCrm} onDismiss={dismiss}
          />
        )}
      </div>

      <JobDetailDrawer job={detailJob} onClose={() => setDetailJob(null)} />
    </div>
  );
}

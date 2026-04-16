"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Rocket, Loader2 } from "lucide-react";
import type { JobLead, JobPipelineTab } from "./types";
import {
  useJobScrape, useJobList, useJobEnrich,
  useJobPushToCrm, useJobPipelineState,
} from "@/hooks/useJobPipeline";
import { useJobSavedSearches } from "@/hooks/useJobSavedSearches";
import ScrapeTab from "./components/ScrapeTab";
import PendingTab from "./components/PendingTab";
import EnrichTab from "./components/EnrichTab";
import EnrichedTab from "./components/EnrichedTab";
import ReviewTab from "./components/ReviewTab";
import JobDetailDrawer from "./components/JobDetailDrawer";

const TABS: { id: JobPipelineTab; label: string }[] = [
  { id: "scrape",   label: "1. Scrape" },
  { id: "pending",  label: "2. Pending" },
  { id: "enrich",   label: "3. Enrich" },
  { id: "enriched", label: "4. Enriched" },
  { id: "review",   label: "5. Review & Push" },
];

/** Explicit phases for AutoPilot state machine — no string matching */
type AutoPilotPhase =
  | "idle"
  | "scraping"
  | "saving"
  | "loading_saved"
  | "enriching"
  | "done"
  | "error";

const PHASE_MESSAGES: Record<AutoPilotPhase, string> = {
  idle:          "",
  scraping:      "Scraping jobs…",
  saving:        "Saving to database…",
  loading_saved: "Loading saved jobs for enrichment…",
  enriching:     "Enriching jobs (AI → DMs → LinkedIn)…",
  done:          "AutoPilot complete!",
  error:         "AutoPilot failed",
};

export default function JobsPage() {
  const { tab, setTab, selected, setSelected, toggleAll, toggle } = useJobPipelineState();
  const { jobs, setJobs, loading, count, listError, fetchJobs } = useJobList();
  const [detailJob, setDetailJob] = useState<JobLead | null>(null);

  // AutoPilot state machine
  const [apPhase, setApPhase] = useState<AutoPilotPhase>("idle");
  const [apError, setApError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const isAutoPilotActive = apPhase !== "idle" && apPhase !== "done" && apPhase !== "error";

  /** Check if AutoPilot has been cancelled */
  const isAborted = useCallback(() => {
    return abortRef.current?.signal?.aborted ?? false;
  }, []);

  // Saved search templates
  const savedSearches = useJobSavedSearches();

  const onScrapeDone = useCallback((scraped: JobLead[]) => {
    // Replace (not merge) — list is already cleared by onClearJobs
    setJobs(scraped);
  }, [setJobs]);

  const onClearJobs = useCallback(() => {
    setJobs([]);
  }, [setJobs]);

  const {
    form, setSource, updateForm, selectedSource,
    scraping, scrapeError, scrapeProgress, saveMsg, saving, scrapeCost,
    scrape, saveJobs,
  } = useJobScrape(onScrapeDone, onClearJobs);

  const {
    enriching, enrichMethod, enrichError, enrichCount, enrichCost, enrichSaveMsg,
    pipelineSteps, pipelineProgress, pipelineBatchMsg,
    enrich, enrichAll,
  } = useJobEnrich(jobs, setJobs);
  const { pushing, pushResult, pushToCrm, dismiss } = useJobPushToCrm(setJobs);

  useEffect(() => {
    if (tab !== "scrape") fetchJobs();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCount = selected.size;

  // ── AutoPilot state machine transitions ────────────────────────────────────

  // Phase: SCRAPING — kick off scrape
  useEffect(() => {
    if (apPhase !== "scraping" || scraping) return;
    if (isAborted()) { setApPhase("idle"); return; }
    setTab("scrape");

    scrape().then(() => {
      if (!isAborted()) setApPhase("saving");
    }).catch((e) => {
      if (!isAborted()) { setApError(String(e)); setApPhase("error"); }
    });
  }, [apPhase, scraping, scrape, setTab, isAborted]);

  // Phase: SAVING — save jobs once scrape populates them
  useEffect(() => {
    if (apPhase !== "saving" || saving || scraping) return;
    if (jobs.length === 0) return; // wait for jobs to populate
    if (isAborted()) { setApPhase("idle"); return; }

    saveJobs(jobs).then(() => {
      if (!isAborted()) setApPhase("loading_saved");
    }).catch((e) => {
      if (!isAborted()) { setApError(String(e)); setApPhase("error"); }
    });
  }, [apPhase, saving, scraping, jobs.length, jobs, saveJobs, isAborted]);

  // Phase: LOADING_SAVED — fetch from DB, then start enrichment
  useEffect(() => {
    if (apPhase !== "loading_saved" || loading) return;
    if (isAborted()) { setApPhase("idle"); return; }

    setTab("enrich");
    fetchJobs().then(() => {
      if (!isAborted()) setApPhase("enriching");
    }).catch((e) => {
      if (!isAborted()) { setApError(String(e)); setApPhase("error"); }
    });
  }, [apPhase, loading, setTab, fetchJobs, isAborted]);

  // Phase: ENRICHING — select eligible jobs and run full pipeline
  useEffect(() => {
    if (apPhase !== "enriching" || enriching) return;
    if (isAborted()) { setApPhase("idle"); return; }

    const eligible = jobs.filter(
      (j) => j.status !== "recruiter_dismissed" && j.status !== "dismissed" && j.status !== "pushed_to_crm",
    );

    if (eligible.length === 0) {
      setApError("No eligible jobs to enrich");
      setApPhase("error");
      return;
    }

    const allIds = new Set(eligible.map((j) => j.id));
    setSelected(allIds);

    enrichAll(allIds).then(() => {
      if (!isAborted()) {
        setApPhase("done");
        setTab("enriched");
        fetchJobs();
      }
    }).catch((e) => {
      if (!isAborted()) { setApError(String(e)); setApPhase("error"); }
    });
  }, [apPhase, enriching, jobs, setSelected, enrichAll, setTab, fetchJobs, isAborted]);

  const startAutoPilot = useCallback(() => {
    // Create new AbortController for this AutoPilot run
    abortRef.current = new AbortController();
    setApError("");
    setApPhase("scraping");
  }, []);

  const cancelAutoPilot = useCallback(() => {
    // Abort all in-flight operations
    abortRef.current?.abort();
    abortRef.current = null;
    setApPhase("idle");
    setApError("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const autoPilotMsg = apError && apPhase === "error"
    ? `AutoPilot failed: ${apError}`
    : PHASE_MESSAGES[apPhase];

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
          <div className="flex items-center gap-3">
            {count > 0 && (
              <span className="text-xs text-gray-500">{count} jobs in database</span>
            )}
            {/* AutoPilot button */}
            <button
              onClick={isAutoPilotActive ? cancelAutoPilot : startAutoPilot}
              disabled={(!isAutoPilotActive && (scraping || enriching || saving || pushing))}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                isAutoPilotActive
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-900/30"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isAutoPilotActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              {isAutoPilotActive ? "Cancel AutoPilot" : "AutoPilot"}
            </button>
          </div>
        </div>

        {/* AutoPilot status */}
        {autoPilotMsg && (
          <div className="mt-2 flex items-center gap-2">
            {isAutoPilotActive && <Loader2 className="h-3 w-3 animate-spin text-orange-400" />}
            <span className={`text-xs ${isAutoPilotActive ? "text-orange-400" : apPhase === "error" ? "text-red-400" : "text-emerald-400"}`}>
              {autoPilotMsg}
            </span>
          </div>
        )}

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
            scraping={scraping} scrapeError={scrapeError} scrapeProgress={scrapeProgress}
            saveMsg={saveMsg} saving={saving} scrapeCost={scrapeCost}
            setSource={setSource} updateForm={updateForm} onScrape={scrape}
            onSave={() => saveJobs(jobs)}
            jobs={jobs} selected={selected}
            toggle={toggle} toggleAll={toggleAll} onViewDetail={setDetailJob}
            savedSearches={savedSearches}
          />
        )}

        {tab === "pending" && (
          <PendingTab
            jobs={jobs} selected={selected} selectedCount={selectedCount}
            loading={loading}
            toggle={toggle} toggleAll={toggleAll} onViewDetail={setDetailJob}
            onRefresh={fetchJobs}
          />
        )}

        {tab === "enrich" && (
          <EnrichTab
            jobs={jobs} selected={selected} selectedCount={selectedCount}
            loading={loading} enriching={enriching} enrichMethod={enrichMethod}
            enrichError={enrichError} enrichCount={enrichCount}
            enrichCost={enrichCost} enrichSaveMsg={enrichSaveMsg}
            pipelineSteps={pipelineSteps} pipelineProgress={pipelineProgress}
            pipelineBatchMsg={pipelineBatchMsg}
            toggle={toggle} toggleAll={toggleAll} onViewDetail={setDetailJob}
            onRefresh={fetchJobs} onEnrich={enrich} onEnrichAll={enrichAll}
          />
        )}

        {tab === "enriched" && (
          <EnrichedTab
            jobs={jobs} selected={selected} selectedCount={selectedCount}
            loading={loading}
            toggle={toggle} toggleAll={toggleAll} onViewDetail={setDetailJob}
            onRefresh={fetchJobs}
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

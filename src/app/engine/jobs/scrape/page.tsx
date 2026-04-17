"use client";

import { useState, useCallback } from "react";
import { useJobScrape, useJobPipelineState } from "@/hooks/useJobPipeline";
import { useJobSavedSearches } from "@/hooks/useJobSavedSearches";
import type { JobLead } from "../types";
import ScrapeTab from "../components/ScrapeTab";
import JobDetailDrawer from "../components/JobDetailDrawer";

export default function ScrapePage() {
  const { selected, toggleAll, toggle } = useJobPipelineState();
  const savedSearches = useJobSavedSearches();
  const [detailJob, setDetailJob] = useState<JobLead | null>(null);
  const [scrapedJobs, setScrapedJobs] = useState<JobLead[]>([]);

  const onScrapeDone = useCallback((jobs: JobLead[]) => setScrapedJobs(jobs), []);
  const onClearJobs  = useCallback(() => setScrapedJobs([]), []);

  const {
    form, setSource, updateForm, selectedSource,
    scraping, scrapeError, scrapeProgress, saveMsg, saving, scrapeCost,
    scrape, saveJobs,
  } = useJobScrape(onScrapeDone, onClearJobs);

  return (
    <>
      <ScrapeTab
        form={form}
        selectedSource={selectedSource}
        scraping={scraping}
        scrapeError={scrapeError}
        scrapeProgress={scrapeProgress}
        saveMsg={saveMsg}
        saving={saving}
        scrapeCost={scrapeCost}
        setSource={setSource}
        updateForm={updateForm}
        onScrape={scrape}
        onSave={() => saveJobs(scrapedJobs)}
        jobs={scrapedJobs}
        selected={selected}
        toggle={toggle}
        toggleAll={toggleAll}
        onViewDetail={setDetailJob}
        savedSearches={savedSearches}
      />
      <JobDetailDrawer job={detailJob} onClose={() => setDetailJob(null)} />
    </>
  );
}

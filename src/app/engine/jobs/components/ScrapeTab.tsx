"use client";

import type { JobLead, JobSearchForm as FormType, JobSource, SourceDef } from "../types";
import JobSearchForm from "./JobSearchForm";
import JobsTable from "./JobsTable";

type Props = {
  form: FormType;
  selectedSource: SourceDef;
  scraping: boolean;
  scrapeError: string;
  saveMsg: string;
  setSource: (s: JobSource) => void;
  updateForm: (patch: Partial<FormType>) => void;
  onScrape: () => void;
  jobs: JobLead[];
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (jobs: JobLead[]) => void;
  onViewDetail: (job: JobLead) => void;
};

export default function ScrapeTab({
  form, selectedSource, scraping, scrapeError, saveMsg,
  setSource, updateForm, onScrape,
  jobs, selected, toggle, toggleAll, onViewDetail,
}: Props) {
  return (
    <div className="space-y-6">
      <JobSearchForm
        form={form}
        selectedSource={selectedSource}
        scraping={scraping}
        scrapeError={scrapeError}
        saveMsg={saveMsg}
        setSource={setSource}
        updateForm={updateForm}
        onScrape={onScrape}
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
          onViewDetail={onViewDetail}
        />
      </div>
    </div>
  );
}

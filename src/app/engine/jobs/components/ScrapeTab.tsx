"use client";

import { Save, Loader2, DollarSign } from "lucide-react";
import type { JobLead, JobSearchForm as FormType, JobSource, SourceDef } from "../types";
import JobSearchForm from "./JobSearchForm";
import JobsTable from "./JobsTable";

type Props = {
  form: FormType;
  selectedSource: SourceDef;
  scraping: boolean;
  scrapeError: string;
  saveMsg: string;
  saving: boolean;
  scrapeCost: number | null;
  setSource: (s: JobSource) => void;
  updateForm: (patch: Partial<FormType>) => void;
  onScrape: () => void;
  onSave: () => void;
  jobs: JobLead[];
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (jobs: JobLead[]) => void;
  onViewDetail: (job: JobLead) => void;
};

export default function ScrapeTab({
  form, selectedSource, scraping, scrapeError, saveMsg, saving, scrapeCost,
  setSource, updateForm, onScrape, onSave,
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
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-gray-300">
              Scraped Results ({jobs.length})
            </h3>
            {scrapeCost != null && scrapeCost > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                <DollarSign className="h-3 w-3" />
                Apify cost: ${scrapeCost.toFixed(4)}
              </span>
            )}
          </div>

          {jobs.length > 0 && (
            <div className="flex items-center gap-2">
              {saveMsg && (
                <span className={`text-xs ${saveMsg.startsWith("⚠") ? "text-yellow-400" : "text-emerald-400"}`}>
                  {saveMsg}
                </span>
              )}
              <button
                onClick={onSave}
                disabled={saving || jobs.length === 0}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save to Database
              </button>
            </div>
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
    </div>
  );
}

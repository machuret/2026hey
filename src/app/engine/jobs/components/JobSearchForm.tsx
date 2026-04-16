"use client";

import { Search, Loader2 } from "lucide-react";
import type { JobSearchForm as FormType, JobSource, SourceDef } from "../types";
import { JOB_SOURCES } from "../types";

type Props = {
  form: FormType;
  selectedSource: SourceDef;
  scraping: boolean;
  scrapeError: string;
  saveMsg: string;
  setSource: (s: JobSource) => void;
  updateForm: (patch: Partial<FormType>) => void;
  onScrape: () => void;
};

export default function JobSearchForm({
  form, selectedSource, scraping, scrapeError, saveMsg,
  setSource, updateForm, onScrape,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Source selector */}
      <div className="flex gap-2">
        {JOB_SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              form.source === s.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {s.label}
            <span className="ml-1.5 text-xs opacity-60">{s.regions}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500">{selectedSource.description}</p>

      {/* Search fields */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 lg:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">Search Term</label>
          <input
            type="text"
            value={form.searchTerm}
            onChange={(e) => updateForm({ searchTerm: e.target.value })}
            placeholder="e.g. marketing manager"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => updateForm({ location: e.target.value })}
            placeholder="e.g. Sydney"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {selectedSource.fields.includes("country") && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Country</label>
            <select
              value={form.country}
              onChange={(e) => updateForm({ country: e.target.value })}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="AU">Australia</option>
              <option value="US">United States</option>
              <option value="NZ">New Zealand</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-400 mb-1">Max Results</label>
          <input
            type="number"
            value={form.maxResults}
            onChange={(e) => updateForm({ maxResults: Number(e.target.value) || 50 })}
            min={10}
            max={500}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {selectedSource.fields.includes("dateRange") && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date Range (days)</label>
            <select
              value={form.dateRange}
              onChange={(e) => updateForm({ dateRange: Number(e.target.value) })}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value={1}>Today</option>
              <option value={3}>Last 3 days</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        )}

        {selectedSource.fields.includes("workType") && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Work Type</label>
            <select
              value={form.workType}
              onChange={(e) => updateForm({ workType: e.target.value })}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Any</option>
              <option value="fulltime">Full Time</option>
              <option value="parttime">Part Time</option>
              <option value="contract">Contract</option>
              <option value="casual">Casual</option>
            </select>
          </div>
        )}
      </div>

      {/* Scrape button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onScrape}
          disabled={scraping}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {scraping ? "Scraping…" : "Scrape Jobs"}
        </button>

        {saveMsg && (
          <span className="text-xs text-emerald-400">{saveMsg}</span>
        )}
      </div>

      {scrapeError && (
        <p className="text-sm text-red-400">{scrapeError}</p>
      )}
    </div>
  );
}

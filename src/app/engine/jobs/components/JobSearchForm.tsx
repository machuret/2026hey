"use client";

import { useState } from "react";
import { Search, Loader2, Bookmark, Trash2, Plus, X } from "lucide-react";
import type { JobSearchForm as FormType, JobSource, SourceDef, SavedSearch } from "../types";
import { JOB_SOURCES, JOB_CATEGORIES, POPULAR_CITIES } from "../types";

type SavedSearchesHook = {
  searches: SavedSearch[];
  loading: boolean;
  error: string;
  saveSearch: (name: string, form: FormType) => Promise<SavedSearch | null>;
  deleteSearch: (id: string) => Promise<void>;
};

type Props = {
  form: FormType;
  selectedSource: SourceDef;
  scraping: boolean;
  scrapeError: string;
  saveMsg: string;
  setSource: (s: JobSource) => void;
  updateForm: (patch: Partial<FormType>) => void;
  onScrape: () => void;
  savedSearches: SavedSearchesHook;
};

export default function JobSearchForm({
  form, selectedSource, scraping, scrapeError, saveMsg,
  setSource, updateForm, onScrape, savedSearches,
}: Props) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [customCity, setCustomCity] = useState("");

  const cities = POPULAR_CITIES[form.country] ?? POPULAR_CITIES.US;

  const toggleCity = (city: string) => {
    const current = form.locations;
    if (current.includes(city)) {
      updateForm({ locations: current.filter((c) => c !== city) });
    } else {
      updateForm({ locations: [...current, city] });
    }
  };

  const addCustomCity = () => {
    const city = customCity.trim();
    if (city && !form.locations.includes(city)) {
      updateForm({ locations: [...form.locations, city] });
    }
    setCustomCity("");
  };

  const loadSavedSearch = (search: SavedSearch) => {
    // Overwrite the entire form with the saved template
    const f = search.form;
    updateForm({
      searchTerm: f.searchTerm ?? "",
      locations: Array.isArray(f.locations) ? f.locations : [],
      country: f.country ?? "AU",
      maxResults: f.maxResults ?? 50,
      dateRange: f.dateRange ?? 7,
      workType: f.workType ?? "",
      industry: f.industry ?? "",
    });
    if (f.source) setSource(f.source);
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim()) return;
    await savedSearches.saveSearch(saveName.trim(), form);
    setShowSaveModal(false);
    setSaveName("");
  };

  return (
    <div className="space-y-4">
      {/* ── Saved Search Templates ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Templates:</span>
        {savedSearches.searches.length === 0 && !savedSearches.loading && (
          <span className="text-xs text-gray-600">No saved searches yet</span>
        )}
        {savedSearches.searches.map((s) => (
          <div key={s.id} className="flex items-center gap-1 group">
            <button
              onClick={() => loadSavedSearch(s)}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white hover:border-indigo-600 transition-colors"
            >
              <Bookmark className="h-3 w-3 text-indigo-400" />
              {s.name}
            </button>
            <button
              onClick={() => savedSearches.deleteSearch(s.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"
              title="Delete template"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Save current search as template */}
        {showSaveModal ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
              placeholder="Template name…"
              autoFocus
              className="rounded-lg bg-gray-800 border border-indigo-600 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none w-48"
            />
            <button
              onClick={handleSaveSearch}
              disabled={!saveName.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setShowSaveModal(false); setSaveName(""); }}
              className="p-1 text-gray-500 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1 rounded-lg border border-dashed border-gray-700 px-3 py-1.5 text-xs text-gray-500 hover:text-indigo-400 hover:border-indigo-600 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Save Search
          </button>
        )}
      </div>

      {/* ── Source selector ── */}
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

      {/* ── Search fields ── */}
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

        {selectedSource.fields.includes("country") && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Country</label>
            <select
              value={form.country}
              onChange={(e) => updateForm({ country: e.target.value, locations: [] })}
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
        <div>
          <label className="block text-xs text-gray-400 mb-1">Industry</label>
          <select
            value={form.industry}
            onChange={(e) => updateForm({ industry: e.target.value })}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Industries</option>
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Multi-city selection ── */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">
          Cities {form.locations.length > 0 && (
            <span className="text-indigo-400">({form.locations.length} selected)</span>
          )}
          <span className="text-gray-600 ml-1">— leave empty to search without location filter</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => toggleCity(city)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                form.locations.includes(city)
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Custom city + selected non-preset cities */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomCity()}
            placeholder="Add custom city…"
            className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none w-44"
          />
          <button
            onClick={addCustomCity}
            disabled={!customCity.trim()}
            className="rounded-lg bg-gray-700 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-600 disabled:opacity-30 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>

          {/* Show custom cities (ones not in the preset list) as removable chips */}
          {form.locations
            .filter((c) => !cities.includes(c))
            .map((city) => (
              <span
                key={city}
                className="flex items-center gap-1 rounded-lg bg-indigo-600/20 border border-indigo-500 px-2 py-1 text-xs text-indigo-300"
              >
                {city}
                <button onClick={() => toggleCity(city)} className="hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
        </div>
      </div>

      {/* ── Scrape button ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onScrape}
          disabled={scraping}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {scraping ? `Scraping${form.locations.length > 1 ? ` ${form.locations.length} cities` : ""}…` : "Scrape Jobs"}
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

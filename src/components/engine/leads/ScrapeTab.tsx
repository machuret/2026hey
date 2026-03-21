"use client";

import { Zap, Loader2, ArrowRight } from "lucide-react";
import { ActorDef, ActorCategory, CATEGORY_META, ScrapedLead } from "@/app/engine/leads/types";
import { ActorPicker } from "./ActorPicker";
import { LeadsTable } from "./LeadsTable";
import { ErrBanner } from "./ErrBanner";

type FormState = {
  query: string;
  location: string;
  jobTitle: string;
  industry: string;
  urlInput: string;
  maxItems: number;
};

type Props = {
  actorId: string;
  selectedActor: ActorDef;
  catFilter: ActorCategory | "all";
  filteredActors: ActorDef[];
  form: FormState;
  scraping: boolean;
  error: string;
  leads: ScrapedLead[];
  selected: Set<number>;
  onActorChange: (id: string) => void;
  onCatChange: (c: ActorCategory | "all") => void;
  onFormChange: (patch: Partial<FormState>) => void;
  onScrape: () => void;
  onToggle: (i: number) => void;
};

export function ScrapeTab({
  actorId, selectedActor, catFilter, filteredActors,
  form, scraping, error, leads, selected,
  onActorChange, onCatChange, onFormChange, onScrape, onToggle,
}: Props) {
  const { query, location, jobTitle, industry, urlInput, maxItems } = form;
  const inp = selectedActor.inputFields;

  return (
    <div className="space-y-5">
      <ActorPicker
        actorId={actorId}
        catFilter={catFilter}
        filteredActors={filteredActors}
        onActorChange={onActorChange}
        onCatChange={onCatChange}
      />

      {/* Dynamic input form */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{selectedActor.label}</h2>
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_META[selectedActor.category].colour}`}>
            {CATEGORY_META[selectedActor.category].label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inp.includes("query") && (
            <label className="block md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Search Query</span>
              <input
                value={query}
                onChange={(e) => onFormChange({ query: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && onScrape()}
                placeholder="e.g. dentists, real estate agents, roofing companies…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </label>
          )}
          {inp.includes("jobTitle") && (
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Job Title</span>
              <input
                value={jobTitle}
                onChange={(e) => onFormChange({ jobTitle: e.target.value })}
                placeholder="e.g. CEO, Owner, Director"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </label>
          )}
          {inp.includes("industry") && (
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Industry</span>
              <input
                value={industry}
                onChange={(e) => onFormChange({ industry: e.target.value })}
                placeholder="e.g. Real Estate, Healthcare, Roofing"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </label>
          )}
          {(inp.includes("url") || inp.includes("domain")) && (
            <label className="block md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">
                {inp.includes("domain") ? "Domain" : "URL"}
              </span>
              <input
                value={urlInput}
                onChange={(e) => onFormChange({ urlInput: e.target.value })}
                placeholder={inp.includes("domain") ? "e.g. company.com" : "https://..."}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </label>
          )}
          {inp.includes("location") && (
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Location (optional)</span>
              <input
                value={location}
                onChange={(e) => onFormChange({ location: e.target.value })}
                placeholder="e.g. Sydney, Australia"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </label>
          )}
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Max Results</span>
            <input
              type="number" min={1} max={200}
              value={maxItems}
              onChange={(e) => onFormChange({ maxItems: Number(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </label>
        </div>

        <ErrBanner msg={error} />

        <button
          onClick={onScrape}
          disabled={scraping}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {scraping ? "Scraping… (30–90s)" : "Run Scraper"}
          {!scraping && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
        </button>
      </div>

      {leads.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-3">{leads.length} leads scraped — preview below</p>
          <LeadsTable rows={leads.slice(0, 5)} selected={selected} onToggle={onToggle} />
          {leads.length > 5 && (
            <p className="text-[10px] text-gray-600 mt-1 text-center">+{leads.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  );
}

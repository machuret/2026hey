"use client";

import { Loader2, Database, ArrowRight, CheckCircle2 } from "lucide-react";
import { ScrapedLead } from "@/app/engine/leads/types";
import { LeadsTable } from "./LeadsTable";
import { ErrBanner } from "./ErrBanner";

type Props = {
  leads: ScrapedLead[];
  selected: Set<number>;
  enriching: boolean;
  error: string;
  enrichCount: number;
  onEnrich: () => void;
  onSkip: () => void;
  onToggle: (i: number) => void;
};

export function EnrichTab({ leads, selected, enriching, error, enrichCount, onEnrich, onSkip, onToggle }: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">Enrich Leads</h2>
          <p className="text-xs text-gray-500">
            Runs <span className="text-emerald-300">Decision Maker Extractor</span> +{" "}
            <span className="text-emerald-300">Phone &amp; Social Scraper</span> on leads missing emails or phones.
            Only runs on leads without existing contact data (max 50 per batch).
          </p>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No leads yet — run Scrape first</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total leads", value: leads.length },
                { label: "Have email",  value: leads.filter((l) => l.email || l.enriched_email).length },
                { label: "Have phone",  value: leads.filter((l) => l.phone || l.enriched_phone).length },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-gray-800 p-3 text-center">
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {enrichCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-900/20 border border-emerald-800 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {enrichCount} leads enriched with new contact data
              </div>
            )}

            <ErrBanner msg={error} />

            <div className="flex gap-3">
              <button
                onClick={onEnrich}
                disabled={enriching}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {enriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                {enriching ? "Enriching… (may take 1–2 min)" : "Run Enrichment"}
                {!enriching && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
              </button>
              <button
                onClick={onSkip}
                className="flex items-center gap-2 rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
              >
                Skip <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {leads.length > 0 && <LeadsTable rows={leads} selected={selected} onToggle={onToggle} />}
    </div>
  );
}

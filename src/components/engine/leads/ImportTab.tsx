"use client";

import { Loader2, Download, CheckCircle2 } from "lucide-react";
import { ScrapedLead } from "@/app/engine/leads/types";
import { LeadsTable } from "./LeadsTable";
import { ErrBanner } from "./ErrBanner";

type Props = {
  leads: ScrapedLead[];
  selected: Set<number>;
  importing: boolean;
  imported: number;
  skipped: number;
  error: string;
  onToggleAll: () => void;
  onToggle: (i: number) => void;
  onImport: () => void;
};

export function ImportTab({
  leads, selected, importing, imported, skipped, error,
  onToggleAll, onToggle, onImport,
}: Props) {

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">Import to CRM</h2>
          <p className="text-xs text-gray-500">
            Review and select which leads to import. AI-scored leads are sorted by score.
          </p>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Download className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No leads yet — run Scrape first</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleAll}
                className="text-xs text-gray-400 hover:text-white underline underline-offset-2"
              >
                {selected.size === leads.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 text-xs text-gray-500">{selected.size} of {leads.length} selected</div>
              {imported > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {imported} imported{skipped > 0 ? ` · ${skipped} skipped (duplicates)` : ""}
                </span>
              )}
              <button
                onClick={onImport}
                disabled={importing || selected.size === 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {importing ? "Importing…" : `Import ${selected.size > 0 ? selected.size : ""} to CRM`}
              </button>
            </div>

            <ErrBanner msg={error} />
          </>
        )}
      </div>

      {leads.length > 0 && (
        <LeadsTable
          rows={leads}
          selected={selected}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Zap, Loader2, CheckCircle2, XCircle, RefreshCw, ChevronRight, Database, Users, Download } from "lucide-react";
import { PipelineTab } from "./types";
import {
  usePipelineLeads, useScrapeActions, useEnrichActions,
  useContactsActions, useImportActions, useApiHealth,
} from "@/hooks/useLeadPipeline";
import { ScrapeTab }   from "@/components/engine/leads/ScrapeTab";
import { EnrichTab }   from "@/components/engine/leads/EnrichTab";
import { ContactsTab } from "@/components/engine/leads/ContactsTab";
import { ImportTab }   from "@/components/engine/leads/ImportTab";

const TABS: { id: PipelineTab; label: string; icon: React.ReactNode }[] = [
  { id: "scrape",   label: "1 · Scrape",   icon: <Zap      className="h-3.5 w-3.5" /> },
  { id: "enrich",   label: "2 · Enrich",   icon: <Database className="h-3.5 w-3.5" /> },
  { id: "contacts", label: "3 · Contacts", icon: <Users    className="h-3.5 w-3.5" /> },
  { id: "import",   label: "4 · Import",   icon: <Download className="h-3.5 w-3.5" /> },
];

export default function LeadsPage() {
  const { leads, setLeads, selected, setSelected, tab, setTab } = usePipelineLeads();
  const { health, checkHealth } = useApiHealth();

  const scrape   = useScrapeActions(leads, setLeads, setSelected, () => setTab("enrich"));
  const enrich   = useEnrichActions(leads, setLeads, () => setTab("contacts"));
  const contacts = useContactsActions(leads, setLeads, enrich.mergeEnriched, () => setTab("import"));
  const imports  = useImportActions(leads, selected, setSelected);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Zap className="h-4 w-4 text-indigo-400" />
              <h1 className="text-lg font-bold text-white">Lead Pipeline</h1>
            </div>
            <p className="text-xs text-gray-500">Scrape → Enrich → Contacts → CRM Import</p>
          </div>
          <div className="flex items-center gap-2">
            {(["crm", "apify"] as const).map((k) => {
              const s = health[k];
              return (
                <div key={k} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-[10px] font-medium ${
                  s.status === "ok"       ? "bg-emerald-900/20 border-emerald-800/50 text-emerald-300"
                  : s.status === "error"  ? "bg-red-900/20 border-red-800/50 text-red-300"
                  :                         "bg-gray-800 border-gray-700 text-gray-500"
                }`}>
                  {s.status === "ok"       && <CheckCircle2 className="h-3 w-3" />}
                  {s.status === "error"    && <XCircle      className="h-3 w-3" />}
                  {s.status === "checking" && <Loader2      className="h-3 w-3 animate-spin" />}
                  {k === "crm" ? "CRM" : "Apify"}
                </div>
              );
            })}
            <button onClick={checkHealth} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex gap-1 mt-4">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.id ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {t.icon} {t.label}
              {leads.length > 0 && t.id !== "scrape" && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{leads.length}</span>
              )}
            </button>
          ))}
          {leads.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{leads.length} in pipeline</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "scrape" && (
          <ScrapeTab
            actorId={scrape.actorId}           selectedActor={scrape.selectedActor}
            catFilter={scrape.catFilter}        filteredActors={scrape.filteredActors}
            form={scrape.form}                  scraping={scrape.scraping}
            error={scrape.scrapeError}          leads={leads}
            selected={selected}
            onActorChange={scrape.setActorId}   onCatChange={scrape.setCatFilter}
            onFormChange={scrape.setForm}        onScrape={scrape.scrape}
            onToggle={imports.toggle}
            onSave={() => scrape.saveAll(false)} onEnrichAndSave={() => scrape.saveAll(true)}
            saving={scrape.saving}              saveMsg={scrape.saveMsg}
          />
        )}
        {tab === "enrich" && (
          <EnrichTab
            leads={leads}          selected={selected}
            enriching={enrich.enriching} error={enrich.enrichError} enrichCount={enrich.enrichCount}
            onEnrich={enrich.enrich} onSkip={() => setTab("contacts")} onToggle={imports.toggle}
          />
        )}
        {tab === "contacts" && (
          <ContactsTab
            leads={leads}
            enriching={contacts.contactsEnriching} error={contacts.contactsError}
            enrichCount={contacts.contactsEnrichCount}
            dmFinding={contacts.dmFinding}         dmError={contacts.dmError}
            dmCount={contacts.dmCount}
            onFillGaps={contacts.fillContactGaps}  onFindDMs={contacts.findDecisionMakers}
            onNext={() => setTab("import")}
          />
        )}
        {tab === "import" && (
          <ImportTab
            leads={leads}            selected={selected}
            importing={imports.importing} imported={imports.imported}
            skipped={imports.skipped}     error={imports.importError}
            onToggleAll={imports.toggleAll} onToggle={imports.toggle}
            onImport={imports.importSelected}
          />
        )}
      </div>
    </div>
  );
}

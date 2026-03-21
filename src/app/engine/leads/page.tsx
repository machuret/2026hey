"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Zap, Loader2, CheckCircle2, XCircle, RefreshCw, ChevronRight, Database, Brain, Download } from "lucide-react";
import {
  ScrapedLead, ActorCategory, ApiHealth, PipelineTab,
  ACTORS, buildActorInput,
} from "./types";
import { ScrapeTab }  from "@/components/engine/leads/ScrapeTab";
import { EnrichTab }  from "@/components/engine/leads/EnrichTab";
import { QualifyTab } from "@/components/engine/leads/QualifyTab";
import { ImportTab }  from "@/components/engine/leads/ImportTab";

export default function LeadsPage() {
  // ── Pipeline ──────────────────────────────────────────────────────
  const [tab, setTab]   = useState<PipelineTab>("scrape");
  const [leads, setLeads] = useState<ScrapedLead[]>([]);

  // ── Scrape form state ─────────────────────────────────────────────
  const [actorId, setActorId]     = useState(ACTORS[0].id);
  const [catFilter, setCatFilter] = useState<ActorCategory | "all">("all");
  const [form, setForm] = useState({
    query: "", location: "", jobTitle: "", industry: "", urlInput: "", maxItems: 20,
  });
  const [scraping, setScraping]       = useState(false);
  const [scrapeError, setScrapeError] = useState("");

  // ── Enrich state ──────────────────────────────────────────────────
  const [enriching, setEnriching]     = useState(false);
  const [enrichError, setEnrichError] = useState("");
  const [enrichCount, setEnrichCount] = useState(0);

  // ── Qualify state ─────────────────────────────────────────────
  const [qualifying, setQualifying]       = useState(false);
  const [qualifyError, setQualifyError]   = useState("");
  const [qualifyWarnings, setQualifyWarnings] = useState<string[]>([]);
  const [scoreThreshold, setScoreThreshold]   = useState(5);
  const [useClaudeForBorderline, setUseClaudeForBorderline] = useState(false);
  const [scoringPrompt, setScoringPrompt] = useState("");

  // ── Import state ──────────────────────────────────────────────
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [imported, setImported]   = useState(0);
  const [skipped, setSkipped]     = useState(0);
  const [importError, setImportError] = useState("");

  // ── Health ────────────────────────────────────────────────────────
  const [health, setHealth] = useState<ApiHealth>({
    crm:   { status: "checking", detail: "" },
    apify: { status: "checking", detail: "" },
  });

  const checkHealth = useCallback(async () => {
    setHealth({ crm: { status: "checking", detail: "" }, apify: { status: "checking", detail: "" } });
    // CRM: lightweight count-only query
    try {
      const res  = await fetch("/api/engine/crm?count=1", { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (res.ok) {
        const count = data.count ?? (Array.isArray(data.leads) ? data.leads.length : "?");
        setHealth((h) => ({ ...h, crm: { status: "ok", detail: `${count} leads in DB` } }));
      } else {
        setHealth((h) => ({ ...h, crm: { status: "error", detail: String(data.error ?? `HTTP ${res.status}`) } }));
      }
    } catch (e) {
      setHealth((h) => ({ ...h, crm: { status: "error", detail: String(e) } }));
    }
    // Apify: edge fn reachability check
    try {
      const res  = await fetch("/api/engine/leads/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "apify/google-maps-scraper", input: {}, maxItems: 0, _healthCheck: true }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      if (res.status === 500 && String(data.error).includes("APIFY_API_KEY not configured")) {
        setHealth((h) => ({ ...h, apify: { status: "error", detail: "APIFY_API_KEY not set in Supabase secrets" } }));
      } else {
        setHealth((h) => ({ ...h, apify: { status: "ok", detail: "Key configured & edge fn reachable" } }));
      }
    } catch (e) {
      setHealth((h) => ({ ...h, apify: { status: "error", detail: String(e) } }));
    }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  // ── Derived ───────────────────────────────────────────────────────
  const selectedActor  = useMemo(() => ACTORS.find((a) => a.id === actorId) ?? ACTORS[0], [actorId]);
  const filteredActors = useMemo(
    () => catFilter === "all" ? ACTORS : ACTORS.filter((a) => a.category === catFilter),
    [catFilter],
  );
  const qualifiedLeads = useMemo(() => leads.filter((l) => l.ai_score !== undefined), [leads]);

  // ── Pipeline actions ──────────────────────────────────────────────
  const scrape = async () => {
    const inp = selectedActor.inputFields;
    const needsQuery = inp.includes("query") || inp.includes("jobTitle");
    const needsUrl   = inp.includes("url")   || inp.includes("domain");
    if (needsQuery && !form.query.trim() && !form.jobTitle.trim()) { setScrapeError("Enter a search query or job title"); return; }
    if (needsUrl   && !form.urlInput.trim())                       { setScrapeError("Enter a URL or domain"); return; }
    setScraping(true); setScrapeError("");
    try {
      const res  = await fetch("/api/engine/leads/scrape", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: actorId, input: buildActorInput(actorId, form), maxItems: form.maxItems }),
        signal: AbortSignal.timeout(120000),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads ?? []);
        setSelected(new Set((data.leads ?? []).map((_: unknown, i: number) => i)));
        setTab("enrich");
      } else { setScrapeError(data.error ?? "Scrape failed"); }
    } catch (e: unknown) {
      setScrapeError(e instanceof Error && e.name === "TimeoutError" ? "Scrape timed out (120s) — try fewer results" : "Network error — scrape failed");
    } finally { setScraping(false); }
  };

  const enrich = async () => {
    if (!leads.length) { setEnrichError("No leads — run Scrape first"); return; }
    setEnriching(true); setEnrichError("");
    try {
      const res  = await fetch("/api/engine/leads/enrich", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
        signal: AbortSignal.timeout(180000),
      });
      const data = await res.json();
      if (data.success) { setLeads(data.leads ?? leads); setEnrichCount(data.enrichedCount ?? 0); setTab("qualify"); }
      else { setEnrichError(data.error ?? "Enrichment failed"); }
    } catch (e: unknown) {
      setEnrichError(e instanceof Error && e.name === "TimeoutError" ? "Enrichment timed out — try a smaller batch (≤20 leads)" : "Network error — enrichment failed");
    } finally { setEnriching(false); }
  };

  const qualify = async (prompt: string, useClaude: boolean) => {
    if (!leads.length) { setQualifyError("No leads to qualify"); return; }
    setQualifying(true); setQualifyError(""); setQualifyWarnings([]);
    try {
      const res  = await fetch("/api/engine/leads/qualify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads, scoringPrompt: prompt || undefined, useClaudeForBorderline: useClaude }),
        signal: AbortSignal.timeout(120000),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads ?? leads);
        if (data.errors?.length) setQualifyWarnings(data.errors);
        setTab("import");
      } else { setQualifyError(data.error ?? "Qualify failed"); }
    } catch (e: unknown) {
      setQualifyError(e instanceof Error && e.name === "TimeoutError" ? "Scoring timed out — try a smaller batch (≤50 leads)" : "Network error — qualify failed");
    } finally { setQualifying(false); }
  };

  const toggleAll = () => {
    setSelected(selected.size === leads.length ? new Set() : new Set(leads.map((_, i) => i)));
  };
  const toggle = (i: number) => {
    setSelected((prev) => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });
  };
  const importSelected = async () => {
    const toImport = Array.from(selected).map((i) => leads[i]);
    if (!toImport.length) return;
    setImporting(true); setImportError("");
    try {
      const res  = await fetch("/api/engine/leads/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toImport }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      if (data.success) { setImported(data.imported); setSkipped(data.skipped ?? 0); setSelected(new Set()); }
      else { setImportError(data.error ?? "Import failed"); }
    } catch (e: unknown) {
      setImportError(e instanceof Error && e.name === "TimeoutError" ? "Import timed out — please retry" : "Network error — import failed");
    } finally { setImporting(false); }
  };
  const selectAboveThreshold = () => {
    setSelected(new Set(
      leads.map((l, i) => (l.ai_score ?? 0) >= scoreThreshold ? i : -1).filter((i) => i >= 0),
    ));
  };

  // ── Tab definitions ───────────────────────────────────────────────
  const TABS = [
    { id: "scrape"  as PipelineTab, label: "1 · Scrape",     icon: <Zap      className="h-3.5 w-3.5" /> },
    { id: "enrich"  as PipelineTab, label: "2 · Enrich",     icon: <Database className="h-3.5 w-3.5" />, count: leads.length || undefined },
    { id: "qualify" as PipelineTab, label: "3 · AI Qualify", icon: <Brain    className="h-3.5 w-3.5" />, count: qualifiedLeads.length || undefined },
    { id: "import"  as PipelineTab, label: "4 · CRM Import", icon: <Download className="h-3.5 w-3.5" />, count: leads.length || undefined },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Zap className="h-4 w-4 text-indigo-400" />
              <h1 className="text-lg font-bold text-white">Lead Pipeline</h1>
            </div>
            <p className="text-xs text-gray-500">Scrape → Enrich → AI Qualify → CRM Import</p>
          </div>
          <div className="flex items-center gap-2">
            {(["crm", "apify"] as const).map((k) => {
              const s = health[k];
              return (
                <div key={k} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-[10px] font-medium ${
                  s.status === "ok"       ? "bg-emerald-900/20 border-emerald-800/50 text-emerald-300" :
                  s.status === "error"    ? "bg-red-900/20 border-red-800/50 text-red-300" :
                                            "bg-gray-800 border-gray-700 text-gray-500"
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
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{t.count}</span>
              )}
            </button>
          ))}
          {leads.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{leads.length} in pipeline</span>
              {qualifiedLeads.length > 0 && <span className="text-emerald-400">· {qualifiedLeads.length} scored</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "scrape" && (
          <ScrapeTab
            actorId={actorId} selectedActor={selectedActor}
            catFilter={catFilter} filteredActors={filteredActors}
            form={form} scraping={scraping} error={scrapeError}
            leads={leads} selected={selected}
            onActorChange={setActorId} onCatChange={setCatFilter}
            onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            onScrape={scrape} onToggle={toggle}
          />
        )}
        {tab === "enrich" && (
          <EnrichTab
            leads={leads} selected={selected}
            enriching={enriching} error={enrichError} enrichCount={enrichCount}
            onEnrich={enrich} onSkip={() => setTab("qualify")} onToggle={toggle}
          />
        )}
        {tab === "qualify" && (
          <QualifyTab
            leads={leads} selected={selected}
            qualifying={qualifying} error={qualifyError} warnings={qualifyWarnings}
            scoreThreshold={scoreThreshold}
            useClaudeForBorderline={useClaudeForBorderline}
            scoringPrompt={scoringPrompt}
            onQualify={qualify} onSkip={() => setTab("import")}
            onThresholdChange={setScoreThreshold}
            onClaudeChange={setUseClaudeForBorderline}
            onPromptChange={setScoringPrompt}
            onToggle={toggle}
          />
        )}
        {tab === "import" && (
          <ImportTab
            leads={leads} selected={selected}
            importing={importing} imported={imported} skipped={skipped} error={importError}
            scoreThreshold={scoreThreshold}
            onToggleAll={toggleAll} onToggle={toggle}
            onSelectAboveThreshold={selectAboveThreshold}
            onImport={importSelected}
          />
        )}
      </div>
    </div>
  );
}

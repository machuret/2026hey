"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Zap, Loader2, CheckSquare, Square, Download, AlertCircle,
  CheckCircle2, XCircle, RefreshCw, Sparkles, Star, Filter,
  ChevronRight, Database, ArrowRight, Brain, Phone, Mail,
  Globe, Building2, Tag, SlidersHorizontal,
} from "lucide-react";

type ScrapedLead = {
  name: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  source: string;
  // Enrichment fields
  enriched_email?: string;
  enriched_phone?: string;
  decision_maker?: string;
  enriched_at?: string;
  // Qualify fields
  ai_score?: number;
  ai_score_reason?: string;
  ai_signals?: string[];
  call_opener?: string;
  raw?: Record<string, unknown>;
};

type ActorCategory = "scrape" | "enrich" | "intel";

type ActorDef = {
  id: string;
  label: string;
  category: ActorCategory;
  description: string;
  costPer1k: string;
  inputFields: ("query" | "location" | "url" | "domain" | "industry" | "jobTitle")[];
};

const ACTORS: ActorDef[] = [
  {
    id: "apify/google-maps-scraper",
    label: "Google Maps Scraper",
    category: "scrape",
    description: "Business name, phone, website, category, address from Google Maps.",
    costPer1k: "~$1–3",
    inputFields: ["query", "location"],
  },
  {
    id: "apify/yellow-pages-scraper",
    label: "Yellow Pages Scraper",
    category: "scrape",
    description: "Name, phone, address, category from Yellow Pages.",
    costPer1k: "~$1",
    inputFields: ["query", "location"],
  },
  {
    id: "code_crafter/leads-finder",
    label: "Leads Finder (Apollo Alt)",
    category: "scrape",
    description: "B2B contacts by title, industry & location with emails included. Apollo alternative.",
    costPer1k: "$1.50",
    inputFields: ["jobTitle", "industry", "location"],
  },
  {
    id: "apify/linkedin-company-scraper",
    label: "LinkedIn Company Scraper",
    category: "scrape",
    description: "Company size, industry, HQ, description from LinkedIn.",
    costPer1k: "~$3",
    inputFields: ["query", "location"],
  },
  {
    id: "dominic-quaiser/decision-maker-name-email-extractor",
    label: "Decision Maker Extractor",
    category: "enrich",
    description: "Crawls a website to extract decision-maker names, titles, and emails.",
    costPer1k: "~$2–5",
    inputFields: ["url"],
  },
  {
    id: "peterasorensen/snacci",
    label: "Phone & Social Scraper",
    category: "enrich",
    description: "Extracts phone numbers and social profiles from websites.",
    costPer1k: "~$1",
    inputFields: ["url"],
  },
  {
    id: "canadesk/hunter-io",
    label: "Hunter.io Email Finder",
    category: "enrich",
    description: "Email lookup by name + domain using Hunter.io.",
    costPer1k: "varies",
    inputFields: ["domain"],
  },
  {
    id: "coladeu/apollo-person-email-enrichment",
    label: "Apollo Email Enrichment",
    category: "enrich",
    description: "Retrieves phone + email for contacts via Apollo.io.",
    costPer1k: "~$2",
    inputFields: ["url"],
  },
  {
    id: "apify/website-content-crawler",
    label: "Website Content Crawler",
    category: "intel",
    description: "Full page content extraction for AI company research and analysis.",
    costPer1k: "~$2",
    inputFields: ["url"],
  },
];

const CATEGORY_META: Record<ActorCategory, { label: string; colour: string }> = {
  scrape:  { label: "Scrape",  colour: "bg-indigo-900/30 text-indigo-300 border-indigo-800/50" },
  enrich:  { label: "Enrich",  colour: "bg-emerald-900/30 text-emerald-300 border-emerald-800/50" },
  intel:   { label: "Intel",   colour: "bg-amber-900/30 text-amber-300 border-amber-800/50" },
};

const SCORE_COLOUR = (s: number) =>
  s >= 8 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";

const SCORE_BG = (s: number) =>
  s >= 8 ? "bg-emerald-900/20 border-emerald-800/50" : s >= 5 ? "bg-amber-900/20 border-amber-800/50" : "bg-red-900/20 border-red-800/50";

type HealthStatus = "checking" | "ok" | "error";
type ApiHealth = {
  crm:   { status: HealthStatus; detail: string };
  apify: { status: HealthStatus; detail: string };
};
type PipelineTab = "scrape" | "enrich" | "qualify" | "import";

export default function LeadsPage() {
  // ── Pipeline state ────────────────────────────────────────────────
  const [tab, setTab]               = useState<PipelineTab>("scrape");
  const [leads, setLeads]           = useState<ScrapedLead[]>([]);

  // ── Scrape tab ────────────────────────────────────────────────────
  const [actorId, setActorId]       = useState(ACTORS[0].id);
  const [catFilter, setCatFilter]   = useState<ActorCategory | "all">("all");
  const [query, setQuery]           = useState("");
  const [location, setLocation]     = useState("");
  const [jobTitle, setJobTitle]     = useState("");
  const [industry, setIndustry]     = useState("");
  const [urlInput, setUrlInput]     = useState("");
  const [maxItems, setMaxItems]     = useState(20);
  const [scraping, setScraping]     = useState(false);
  const [scrapeError, setScrapeError] = useState("");

  // ── Enrich tab ────────────────────────────────────────────────────
  const [enriching, setEnriching]   = useState(false);
  const [enrichError, setEnrichError] = useState("");
  const [enrichCount, setEnrichCount] = useState(0);

  // ── Qualify tab ───────────────────────────────────────────────────
  const [qualifying, setQualifying] = useState(false);
  const [qualifyError, setQualifyError] = useState("");
  const [scoreThreshold, setScoreThreshold] = useState(5);
  const [useClaudeForBorderline, setUseClaudeForBorderline] = useState(false);
  const [scoringPrompt, setScoringPrompt] = useState("");
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // ── Import tab ────────────────────────────────────────────────────
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [importing, setImporting]   = useState(false);
  const [imported, setImported]     = useState(0);
  const [importError, setImportError] = useState("");

  // ── Health ────────────────────────────────────────────────────────
  const [health, setHealth]         = useState<ApiHealth>({
    crm:   { status: "checking", detail: "" },
    apify: { status: "checking", detail: "" },
  });

  // ── Health check ─────────────────────────────────────────────────
  const checkHealth = useCallback(async () => {
    setHealth({ crm: { status: "checking", detail: "" }, apify: { status: "checking", detail: "" } });
    try {
      const res  = await fetch("/api/engine/crm");
      const data = await res.json();
      if (res.ok && Array.isArray(data.leads)) {
        setHealth((h) => ({ ...h, crm: { status: "ok", detail: `${data.leads.length} leads in DB` } }));
      } else {
        setHealth((h) => ({ ...h, crm: { status: "error", detail: String(data.error ?? `HTTP ${res.status}`) } }));
      }
    } catch (e) {
      setHealth((h) => ({ ...h, crm: { status: "error", detail: String(e) } }));
    }
    try {
      const res  = await fetch("/api/engine/leads/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "apify/google-maps-scraper", input: {}, maxItems: 0, _healthCheck: true }),
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
  const selectedActor = useMemo(() => ACTORS.find((a) => a.id === actorId) ?? ACTORS[0], [actorId]);
  const filteredActors = useMemo(
    () => catFilter === "all" ? ACTORS : ACTORS.filter((a) => a.category === catFilter),
    [catFilter],
  );
  const qualifiedLeads  = useMemo(() => leads.filter((l) => l.ai_score !== undefined), [leads]);
  const aboveThreshold  = useMemo(() => leads.filter((l) => (l.ai_score ?? 0) >= scoreThreshold), [leads, scoreThreshold]);

  // ── Build actor-specific Apify input ─────────────────────────────
  function buildActorInput(): Record<string, unknown> {
    switch (actorId) {
      case "apify/google-maps-scraper":
        return { searchStringsArray: [query], locationQuery: location || undefined, maxCrawledPlacesPerSearch: maxItems };
      case "apify/yellow-pages-scraper":
        return { search: query, location: location || undefined, maxItems };
      case "code_crafter/leads-finder":
        return { jobTitles: [jobTitle], industries: industry ? [industry] : undefined, locations: location ? [location] : undefined, maxLeads: maxItems };
      case "apify/linkedin-company-scraper":
        return { searchQueries: [query], location: location || undefined, maxItems };
      case "dominic-quaiser/decision-maker-name-email-extractor":
      case "peterasorensen/snacci":
      case "coladeu/apollo-person-email-enrichment":
      case "apify/website-content-crawler":
        return { startUrls: [{ url: urlInput }], maxCrawledPages: maxItems };
      case "canadesk/hunter-io":
        return { domain: urlInput, maxItems };
      default:
        return { startUrls: [{ url: query || urlInput }], maxCrawledPages: maxItems };
    }
  }

  // ── Scrape ────────────────────────────────────────────────────────
  const scrape = async () => {
    const needsQuery  = selectedActor.inputFields.includes("query") || selectedActor.inputFields.includes("jobTitle");
    const needsUrl    = selectedActor.inputFields.includes("url") || selectedActor.inputFields.includes("domain");
    if (needsQuery && !query.trim() && !jobTitle.trim()) { setScrapeError("Enter a search query or job title"); return; }
    if (needsUrl   && !urlInput.trim())                  { setScrapeError("Enter a URL or domain"); return; }
    setScraping(true);
    setScrapeError("");
    try {
      const res  = await fetch("/api/engine/leads/scrape", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ actor: actorId, input: buildActorInput(), maxItems }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads ?? []);
        setSelected(new Set((data.leads ?? []).map((_: unknown, i: number) => i)));
        setTab("enrich");
      } else {
        setScrapeError(data.error ?? "Scrape failed");
      }
    } catch {
      setScrapeError("Network error — scrape failed");
    } finally {
      setScraping(false);
    }
  };

  // ── Enrich ────────────────────────────────────────────────────────
  const enrich = async () => {
    if (leads.length === 0) { setEnrichError("No leads to enrich — run Scrape first"); return; }
    setEnriching(true);
    setEnrichError("");
    try {
      const res  = await fetch("/api/engine/leads/enrich", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ leads }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads ?? leads);
        setEnrichCount(data.enrichedCount ?? 0);
        setTab("qualify");
      } else {
        setEnrichError(data.error ?? "Enrichment failed");
      }
    } catch {
      setEnrichError("Network error — enrichment failed");
    } finally {
      setEnriching(false);
    }
  };

  // ── AI Qualify ────────────────────────────────────────────────────
  const qualify = async () => {
    if (leads.length === 0) { setQualifyError("No leads to qualify"); return; }
    setQualifying(true);
    setQualifyError("");
    try {
      const res  = await fetch("/api/engine/leads/qualify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ leads, scoringPrompt: scoringPrompt || undefined, useClaudeForBorderline }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads ?? leads);
        setTab("import");
      } else {
        setQualifyError(data.error ?? "Qualify failed");
      }
    } catch {
      setQualifyError("Network error — qualify failed");
    } finally {
      setQualifying(false);
    }
  };

  // ── Import ────────────────────────────────────────────────────────
  const toggleAll = () => {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map((_, i) => i)));
  };
  const toggle = (i: number) => {
    setSelected((prev) => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });
  };
  const importSelected = async () => {
    const toImport = Array.from(selected).map((i) => leads[i]);
    if (toImport.length === 0) return;
    setImporting(true);
    setImportError("");
    try {
      const res  = await fetch("/api/engine/leads/import", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ leads: toImport }),
      });
      const data = await res.json();
      if (data.success) { setImported(data.imported); setSelected(new Set()); }
      else { setImportError(data.error ?? "Import failed"); }
    } catch {
      setImportError("Network error — import failed");
    } finally {
      setImporting(false);
    }
  };

  // ── Reusable sub-components ───────────────────────────────────────
  const ErrBanner = ({ msg }: { msg: string }) => msg ? (
    <div className="flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-800 px-3 py-2 text-xs text-red-300">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {msg}
    </div>
  ) : null;

  const LeadsTable = ({ rows, showScore }: { rows: ScrapedLead[]; showScore?: boolean }) => (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-800/50">
            <th className="w-8 px-3 py-2" />
            {showScore && <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Score</th>}
            <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Company</th>
            <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider"><Phone className="h-3 w-3 inline mr-1" />Phone</th>
            <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider"><Mail className="h-3 w-3 inline mr-1" />Email</th>
            <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider"><Building2 className="h-3 w-3 inline mr-1" />Industry</th>
            {showScore && <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Opener</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((lead, i) => (
            <tr
              key={i}
              onClick={() => toggle(i)}
              className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selected.has(i) ? "bg-indigo-950/30" : "hover:bg-gray-800/30"}`}
            >
              <td className="px-3 py-2.5">
                {selected.has(i) ? <CheckSquare className="h-3.5 w-3.5 text-indigo-400" /> : <Square className="h-3.5 w-3.5 text-gray-600" />}
              </td>
              {showScore && (
                <td className="px-3 py-2.5">
                  {lead.ai_score !== undefined ? (
                    <span className={`font-bold text-sm ${SCORE_COLOUR(lead.ai_score)}`}>{lead.ai_score}</span>
                  ) : <span className="text-gray-600">—</span>}
                </td>
              )}
              <td className="px-3 py-2.5 text-white font-medium">{lead.company || lead.name || "—"}</td>
              <td className="px-3 py-2.5 text-gray-400">{lead.phone || lead.enriched_phone || "—"}</td>
              <td className="px-3 py-2.5 text-gray-400">{lead.email || lead.enriched_email || "—"}</td>
              <td className="px-3 py-2.5 text-gray-400">{lead.industry || "—"}</td>
              {showScore && (
                <td className="px-3 py-2.5 text-gray-500 max-w-[200px] truncate" title={lead.call_opener}>
                  {lead.call_opener || "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const TABS: { id: PipelineTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "scrape",  label: "1 · Scrape",   icon: <Zap className="h-3.5 w-3.5" /> },
    { id: "enrich",  label: "2 · Enrich",   icon: <Database className="h-3.5 w-3.5" />, count: leads.length },
    { id: "qualify", label: "3 · AI Qualify", icon: <Brain className="h-3.5 w-3.5" />, count: qualifiedLeads.length || undefined },
    { id: "import",  label: "4 · CRM Import", icon: <Download className="h-3.5 w-3.5" />, count: leads.filter(l => l.ai_score !== undefined).length || leads.length || undefined },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Zap className="h-4 w-4 text-indigo-400" />
              <h1 className="text-lg font-bold text-white">Lead Pipeline</h1>
            </div>
            <p className="text-xs text-gray-500">Scrape → Enrich → AI Qualify → CRM Import</p>
          </div>
          {/* Health indicators */}
          <div className="flex items-center gap-2">
            {(["crm", "apify"] as const).map((k) => {
              const s = health[k];
              return (
                <div key={k} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-[10px] font-medium ${
                  s.status === "ok" ? "bg-emerald-900/20 border-emerald-800/50 text-emerald-300" :
                  s.status === "error" ? "bg-red-900/20 border-red-800/50 text-red-300" :
                  "bg-gray-800 border-gray-700 text-gray-500"
                }`}>
                  {s.status === "ok"       && <CheckCircle2 className="h-3 w-3" />}
                  {s.status === "error"    && <XCircle className="h-3 w-3" />}
                  {s.status === "checking" && <Loader2 className="h-3 w-3 animate-spin" />}
                  {k === "crm" ? "CRM" : "Apify"}
                </div>
              );
            })}
            <button onClick={checkHealth} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Pipeline tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
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
              <span>{leads.length} leads in pipeline</span>
              {qualifiedLeads.length > 0 && (
                <span className="text-emerald-400">· {qualifiedLeads.length} scored</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── TAB 1: SCRAPE ─────────────────────────────────────────── */}
        {tab === "scrape" && (
          <div className="space-y-5">
            {/* Category filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs text-gray-500 mr-1">Category:</span>
              {(["all", "scrape", "enrich", "intel"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    catFilter === c ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {c === "all" ? "All" : CATEGORY_META[c].label}
                </button>
              ))}
            </div>

            {/* Actor cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredActors.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActorId(a.id)}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    actorId === a.id
                      ? "border-indigo-500 bg-indigo-950/30"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold text-white leading-tight">{a.label}</span>
                    <span className={`shrink-0 ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_META[a.category].colour}`}>
                      {CATEGORY_META[a.category].label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{a.description}</p>
                  <p className="text-[10px] text-gray-600">Cost/1k: {a.costPer1k}</p>
                </button>
              ))}
            </div>

            {/* Dynamic input form for selected actor */}
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">{selectedActor.label}</h2>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_META[selectedActor.category].colour}`}>
                  {CATEGORY_META[selectedActor.category].label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedActor.inputFields.includes("query") && (
                  <label className="block md:col-span-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Search Query</span>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && scrape()}
                      placeholder="e.g. dentists, real estate agents, roofing companies…"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
                  </label>
                )}
                {selectedActor.inputFields.includes("jobTitle") && (
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Job Title</span>
                    <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. CEO, Owner, Director"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
                  </label>
                )}
                {selectedActor.inputFields.includes("industry") && (
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Industry</span>
                    <input value={industry} onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Real Estate, Healthcare, Roofing"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
                  </label>
                )}
                {(selectedActor.inputFields.includes("url") || selectedActor.inputFields.includes("domain")) && (
                  <label className="block md:col-span-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">
                      {selectedActor.inputFields.includes("domain") ? "Domain" : "URL"}
                    </span>
                    <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={selectedActor.inputFields.includes("domain") ? "e.g. company.com" : "https://..."}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
                  </label>
                )}
                {selectedActor.inputFields.includes("location") && (
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Location (optional)</span>
                    <input value={location} onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Sydney, Australia"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
                  </label>
                )}
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Max Results</span>
                  <input type="number" min={1} max={200} value={maxItems} onChange={(e) => setMaxItems(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </label>
              </div>

              <ErrBanner msg={scrapeError} />

              <button onClick={scrape} disabled={scraping}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {scraping ? "Scraping… (30–90s)" : "Run Scraper"}
                {!scraping && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
              </button>
            </div>

            {leads.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-3">{leads.length} leads scraped — preview below</p>
                <LeadsTable rows={leads.slice(0, 5)} />
                {leads.length > 5 && <p className="text-[10px] text-gray-600 mt-1 text-center">+{leads.length - 5} more</p>}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ENRICH ─────────────────────────────────────────── */}
        {tab === "enrich" && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">Enrich Leads</h2>
                <p className="text-xs text-gray-500">
                  Runs <span className="text-emerald-300">Decision Maker Extractor</span> + <span className="text-emerald-300">Phone &amp; Social Scraper</span> on leads missing emails or phones.
                  Enrichment only runs on leads without existing contact data (max 50 per batch).
                </p>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No leads yet — run Scrape first</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total leads",    value: leads.length },
                      { label: "Have email",     value: leads.filter(l => l.email || l.enriched_email).length },
                      { label: "Have phone",     value: leads.filter(l => l.phone || l.enriched_phone).length },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl bg-gray-800 p-3 text-center">
                        <p className="text-xl font-bold text-white">{value}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {enrichCount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-900/20 border border-emerald-800 px-3 py-2 text-xs text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {enrichCount} leads enriched with new contact data
                    </div>
                  )}

                  <ErrBanner msg={enrichError} />

                  <div className="flex gap-3">
                    <button onClick={enrich} disabled={enriching}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                      {enriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                      {enriching ? "Enriching… (may take 1–2 min)" : "Run Enrichment"}
                      {!enriching && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
                    </button>
                    <button onClick={() => setTab("qualify")}
                      className="flex items-center gap-2 rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-colors">
                      Skip <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {leads.length > 0 && <LeadsTable rows={leads} />}
          </div>
        )}

        {/* ── TAB 3: AI QUALIFY ─────────────────────────────────────── */}
        {tab === "qualify" && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">AI Lead Scoring</h2>
                <p className="text-xs text-gray-500">
                  GPT-4o-mini scores each lead 1–10 with reasoning, signals, and a personalised cold-call opener.
                  Optionally use Claude Haiku for borderline leads (score 4–6) for a second opinion.
                </p>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No leads yet — run Scrape first</p>
                </div>
              ) : (
                <>
                  {/* Score threshold slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-400 flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Min score threshold
                      </label>
                      <span className={`text-sm font-bold ${SCORE_COLOUR(scoreThreshold)}`}>{scoreThreshold}/10</span>
                    </div>
                    <input type="range" min={1} max={10} value={scoreThreshold}
                      onChange={(e) => setScoreThreshold(Number(e.target.value))}
                      className="w-full accent-indigo-500" />
                    {qualifiedLeads.length > 0 && (
                      <p className="text-[10px] text-gray-500">
                        {aboveThreshold.length} of {qualifiedLeads.length} leads score ≥ {scoreThreshold}
                      </p>
                    )}
                  </div>

                  {/* Claude toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <button
                      onClick={() => setUseClaudeForBorderline((v) => !v)}
                      className={`w-9 h-5 rounded-full transition-colors ${useClaudeForBorderline ? "bg-indigo-600" : "bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${useClaudeForBorderline ? "translate-x-4" : ""}`} />
                    </button>
                    <span className="text-xs text-gray-400">Use Claude Haiku for borderline scores (4–6) — better nuanced reasoning</span>
                  </label>

                  {/* Custom prompt toggle */}
                  <div>
                    <button onClick={() => setShowPromptEditor((v) => !v)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {showPromptEditor ? "Hide" : "Customise"} scoring prompt
                    </button>
                    {showPromptEditor && (
                      <textarea
                        value={scoringPrompt}
                        onChange={(e) => setScoringPrompt(e.target.value)}
                        placeholder="Leave blank to use the default cold-calling agency prompt…"
                        rows={5}
                        className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    )}
                  </div>

                  <ErrBanner msg={qualifyError} />

                  <div className="flex gap-3">
                    <button onClick={qualify} disabled={qualifying}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                      {qualifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                      {qualifying ? `Scoring ${leads.length} leads…` : "Score Leads with AI"}
                      {!qualifying && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
                    </button>
                    <button onClick={() => setTab("import")}
                      className="flex items-center gap-2 rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-colors">
                      Skip <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Score distribution */}
            {qualifiedLeads.length > 0 && (
              <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Score Distribution</h3>
                <div className="flex items-end gap-1 h-12">
                  {[1,2,3,4,5,6,7,8,9,10].map((s) => {
                    const count = qualifiedLeads.filter(l => l.ai_score === s).length;
                    const pct   = qualifiedLeads.length > 0 ? (count / qualifiedLeads.length) * 100 : 0;
                    return (
                      <div key={s} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t ${s >= 8 ? "bg-emerald-500" : s >= 5 ? "bg-amber-500" : "bg-red-500"} opacity-70`}
                          style={{ height: `${Math.max(pct, 2)}%`, minHeight: count > 0 ? "4px" : "0" }}
                        />
                        <span className="text-[9px] text-gray-600">{s}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {leads.length > 0 && <LeadsTable rows={leads} showScore />}
          </div>
        )}

        {/* ── TAB 4: CRM IMPORT ─────────────────────────────────────── */}
        {tab === "import" && (
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
                  {/* Filter controls */}
                  {qualifiedLeads.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs text-gray-500">Quick select:</span>
                      <button onClick={() => setSelected(new Set(leads.map((l, i) => (l.ai_score ?? 0) >= scoreThreshold ? i : -1).filter(i => i >= 0)))}
                        className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                        Score ≥ {scoreThreshold} ({aboveThreshold.length})
                      </button>
                      <span className="text-gray-700">·</span>
                      <button onClick={toggleAll} className="text-xs text-gray-400 hover:text-white underline underline-offset-2">
                        {selected.size === leads.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-xs text-gray-500">{selected.size} of {leads.length} selected</div>
                    {imported > 0 && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {imported} imported to CRM
                      </span>
                    )}
                    <button onClick={importSelected} disabled={importing || selected.size === 0}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                      {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {importing ? "Importing…" : `Import ${selected.size > 0 ? selected.size : ""} to CRM`}
                    </button>
                  </div>

                  <ErrBanner msg={importError} />
                </>
              )}
            </div>

            {leads.length > 0 && <LeadsTable rows={leads} showScore={qualifiedLeads.length > 0} />}
          </div>
        )}
      </div>
    </div>
  );
}

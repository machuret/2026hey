"use client";

import { useState, useEffect } from "react";
import { Zap, Loader2, CheckSquare, Square, Download, AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

type ScrapedLead = {
  name: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  source: "scraper";
  raw?: Record<string, unknown>;
};

const ACTORS = [
  { id: "apify/google-maps-scraper",       label: "Google Maps Scraper" },
  { id: "apify/website-content-crawler",   label: "Website Content Crawler" },
  { id: "apify/linkedin-company-scraper",  label: "LinkedIn Company Scraper" },
  { id: "apify/yellow-pages-scraper",      label: "Yellow Pages Scraper" },
];

type HealthStatus = "checking" | "ok" | "error";

type ApiHealth = {
  crm:   { status: HealthStatus; detail: string };
  apify: { status: HealthStatus; detail: string };
};

export default function LeadsPage() {
  const [actor, setActor]         = useState(ACTORS[0].id);
  const [query, setQuery]         = useState("");
  const [location, setLocation]   = useState("");
  const [maxItems, setMaxItems]   = useState(20);
  const [scraping, setScraping]   = useState(false);
  const [results, setResults]     = useState<ScrapedLead[]>([]);
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [error, setError]         = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported]   = useState(0);
  const [health, setHealth]       = useState<ApiHealth>({
    crm:   { status: "checking", detail: "" },
    apify: { status: "checking", detail: "" },
  });

  const checkHealth = async () => {
    setHealth({ crm: { status: "checking", detail: "" }, apify: { status: "checking", detail: "" } });

    // Check CRM endpoint (quick DB round-trip)
    try {
      const res = await fetch("/api/engine/crm");
      const data = await res.json();
      if (res.ok && Array.isArray(data.leads)) {
        setHealth((h) => ({ ...h, crm: { status: "ok", detail: `${data.leads.length} leads in DB` } }));
      } else {
        setHealth((h) => ({ ...h, crm: { status: "error", detail: data.error ?? `HTTP ${res.status}` } }));
      }
    } catch (e) {
      setHealth((h) => ({ ...h, crm: { status: "error", detail: String(e) } }));
    }

    // Check Apify key is set via a lightweight ping to the scrape edge fn config
    try {
      const res = await fetch("/api/engine/leads/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "apify/google-maps-scraper", input: {}, maxItems: 0, _healthCheck: true }),
      });
      const data = await res.json();
      if (res.status === 500 && data.error?.includes("APIFY_API_KEY not configured")) {
        setHealth((h) => ({ ...h, apify: { status: "error", detail: "APIFY_API_KEY not set in Supabase secrets" } }));
      } else {
        // Any other response (including Apify errors) means the key reached the edge fn
        setHealth((h) => ({ ...h, apify: { status: "ok", detail: "Key configured & edge fn reachable" } }));
      }
    } catch (e) {
      setHealth((h) => ({ ...h, apify: { status: "error", detail: String(e) } }));
    }
  };

  useEffect(() => { checkHealth(); }, []);

  const scrape = async () => {
    if (!query.trim()) { setError("Enter a search query"); return; }
    setScraping(true);
    setError("");
    setResults([]);
    setSelected(new Set());
    setImported(0);

    // Build actor-specific input
    const input: Record<string, unknown> =
      actor === "apify/google-maps-scraper"
        ? { searchStringsArray: [query], locationQuery: location || undefined, maxCrawledPlacesPerSearch: maxItems }
        : actor === "apify/yellow-pages-scraper"
          ? { search: query, location: location || undefined, maxItems }
          : { startUrls: [{ url: query }], maxCrawledPages: maxItems };

    try {
      const res = await fetch("/api/engine/leads/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor, input, maxItems }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.leads ?? []);
        setSelected(new Set((data.leads ?? []).map((_: unknown, i: number) => i)));
      } else {
        setError(data.error ?? "Scrape failed");
      }
    } catch {
      setError("Network error — scrape failed");
    } finally {
      setScraping(false);
    }
  };

  const toggleAll = () => {
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map((_, i) => i)));
  };

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const importSelected = async () => {
    const toImport = Array.from(selected).map((i) => results[i]);
    if (toImport.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/engine/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toImport }),
      });
      const data = await res.json();
      if (data.success) {
        setImported(data.imported);
        setSelected(new Set());
      } else {
        setError(data.error ?? "Import failed");
      }
    } catch {
      setError("Network error — import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-indigo-400" />
          <h1 className="text-lg font-bold text-white">Lead Scraper</h1>
        </div>
        <p className="text-xs text-gray-500">Scrape leads via Apify then import directly into CRM</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* API Health Check */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">API Status</h2>
            <button
              onClick={checkHealth}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Recheck
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { key: "crm" as const,   label: "Supabase CRM" },
              { key: "apify" as const, label: "Apify Edge Fn" },
            ]).map(({ key, label }) => {
              const s = health[key];
              return (
                <div key={key} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 border ${
                  s.status === "ok"       ? "bg-emerald-900/20 border-emerald-800/50" :
                  s.status === "error"    ? "bg-red-900/20 border-red-800/50" :
                  "bg-gray-800/50 border-gray-700"
                }`}>
                  {s.status === "ok"      && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
                  {s.status === "error"   && <XCircle      className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                  {s.status === "checking"&& <Loader2      className="h-4 w-4 text-gray-400 shrink-0 mt-0.5 animate-spin" />}
                  <div>
                    <p className={`text-xs font-semibold ${
                      s.status === "ok" ? "text-emerald-300" : s.status === "error" ? "text-red-300" : "text-gray-400"
                    }`}>{label}</p>
                    {s.detail && <p className="text-[10px] text-gray-500 mt-0.5">{s.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Config panel */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Scrape Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Apify Actor</span>
              <select
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {ACTORS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Max Results</span>
              <input
                type="number"
                min={1}
                max={200}
                value={maxItems}
                onChange={(e) => setMaxItems(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">
                Search Query / URL
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scrape()}
                placeholder="e.g. dentists, real estate agents, roofing companies…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block">Location (optional)</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sydney, Australia"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-700 px-3 py-2 text-xs text-red-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={scrape}
            disabled={scraping}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {scraping ? "Scraping… (this may take 30–90s)" : "Run Scraper"}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <button onClick={toggleAll} className="text-gray-400 hover:text-white">
                  {selected.size === results.length
                    ? <CheckSquare className="h-4 w-4 text-indigo-400" />
                    : <Square className="h-4 w-4" />}
                </button>
                <span className="text-sm font-semibold text-white">{results.length} leads found</span>
                <span className="text-xs text-gray-500">{selected.size} selected</span>
              </div>
              <div className="flex items-center gap-2">
                {imported > 0 && (
                  <span className="text-xs text-emerald-400 font-medium">✓ {imported} imported to CRM</span>
                )}
                <button
                  onClick={importSelected}
                  disabled={importing || selected.size === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Import {selected.size > 0 ? `${selected.size} ` : ""}to CRM
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="w-8 px-3 py-2" />
                    <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Company</th>
                    <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Phone</th>
                    <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Email</th>
                    <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Industry</th>
                    <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Website</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((lead, i) => (
                    <tr
                      key={i}
                      onClick={() => toggle(i)}
                      className={`border-b border-gray-800/50 cursor-pointer transition-colors ${
                        selected.has(i) ? "bg-indigo-950/30" : "hover:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        {selected.has(i)
                          ? <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                          : <Square className="h-3.5 w-3.5 text-gray-600" />}
                      </td>
                      <td className="px-3 py-2.5 text-white font-medium">{lead.name || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-400">{lead.company || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-400">{lead.phone || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-400">{lead.email || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-400">{lead.industry || "—"}</td>
                      <td className="px-3 py-2.5">
                        {lead.website
                          ? <a href={lead.website} target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-400 hover:text-indigo-300 underline truncate max-w-[140px] block">
                              {lead.website.replace(/^https?:\/\//, "")}
                            </a>
                          : <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

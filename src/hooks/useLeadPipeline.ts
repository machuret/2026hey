"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ScrapedLead, ActorCategory, PipelineTab,
  ACTORS, buildActorInput,
} from "@/app/engine/leads/types";

// ─── Scrape form shape ────────────────────────────────────────────────────────
export type ScrapeForm = {
  query: string;
  location: string;
  jobTitle: string;
  industry: string;
  urlInput: string;
  maxItems: number;
};

// ─── useScrapeActions ─────────────────────────────────────────────────────────
export function useScrapeActions(
  leads: ScrapedLead[],
  setLeads: (l: ScrapedLead[]) => void,
  setSelected: (s: Set<number>) => void,
  onDone: () => void,
) {
  const [actorId, setActorId]     = useState(ACTORS[0].id);
  const [catFilter, setCatFilter] = useState<ActorCategory | "all">("all");
  const [form, setForm]           = useState<ScrapeForm>({
    query: "", location: "", jobTitle: "", industry: "", urlInput: "", maxItems: 20,
  });
  const [scraping, setScraping]       = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState("");

  const selectedActor  = useMemo(() => ACTORS.find((a) => a.id === actorId) ?? ACTORS[0], [actorId]);
  const filteredActors = useMemo(
    () => catFilter === "all" ? ACTORS : ACTORS.filter((a) => a.category === catFilter),
    [catFilter],
  );

  const scrape = useCallback(async () => {
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
        signal: AbortSignal.timeout(120_000),
      });
      const data = await res.json();
      if (data.success) {
        const scraped: ScrapedLead[] = data.leads ?? [];
        setLeads(scraped);
        setSelected(new Set(scraped.map((_: unknown, i: number) => i)));
        if (scraped.length > 0) {
          setSaving(true); setSaveMsg("Auto-saving…");
          try {
            const saveRes  = await fetch("/api/engine/leads/import", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ leads: scraped }),
              signal: AbortSignal.timeout(30_000),
            });
            const saveData = await saveRes.json();
            if (saveData.success) {
              setSaveMsg(`✓ ${saveData.imported} saved to CRM${saveData.skipped ? ` (${saveData.skipped} duplicates skipped)` : ""}`);
            }
          } catch { /* non-fatal — leads still visible in UI */ }
          finally { setSaving(false); }
        }
        onDone();
      } else { setScrapeError(data.error ?? "Scrape failed"); }
    } catch (e: unknown) {
      setScrapeError(e instanceof Error && e.name === "TimeoutError" ? "Scrape timed out (120s) — try fewer results" : "Network error — scrape failed");
    } finally { setScraping(false); }
  }, [actorId, form, selectedActor, setLeads, setSelected, onDone]);

  const saveAll = useCallback(async (withEnrich = false) => {
    if (!leads.length) return;
    setSaving(true); setSaveMsg("");
    try {
      let toSave = leads;
      if (withEnrich) {
        setSaveMsg("Finding emails…");
        try {
          const res  = await fetch("/api/engine/leads/enrich", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leads }),
            signal: AbortSignal.timeout(120_000),
          });
          const data = await res.json();
          if (data.success) toSave = data.leads ?? leads;
          else setSaveMsg(`⚠ Enrich failed (${data.error ?? "unknown"}) — saving original data`);
        } catch {
          setSaveMsg("⚠ Enrich timed out — saving original data");
        }
      }
      setSaveMsg("Saving…");
      const res  = await fetch("/api/engine/leads/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toSave }),
        signal: AbortSignal.timeout(30_000),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(toSave);
        setSaveMsg(`✓ ${data.imported} saved, ${data.skipped ?? 0} duplicates skipped`);
      } else {
        setSaveMsg(`Error: ${data.error ?? "Save failed"}`);
      }
    } catch {
      setSaveMsg("Network error — save failed");
    } finally { setSaving(false); }
  }, [leads, setLeads]);

  return {
    actorId, setActorId, catFilter, setCatFilter,
    form, setForm: (patch: Partial<ScrapeForm>) => setForm((f) => ({ ...f, ...patch })),
    scraping, scrapeError,
    saving, saveMsg,
    selectedActor, filteredActors,
    scrape, saveAll,
  };
}

// ─── useEnrichActions ─────────────────────────────────────────────────────────
export function useEnrichActions(
  leads: ScrapedLead[],
  setLeads: React.Dispatch<React.SetStateAction<ScrapedLead[]>>,
  onDone: () => void,
) {
  const [enriching, setEnriching]     = useState(false);
  const [enrichError, setEnrichError] = useState("");
  const [enrichCount, setEnrichCount] = useState(0);

  const mergeEnriched = useCallback((incoming: ScrapedLead[], prev: ScrapedLead[]): ScrapedLead[] => {
    const map = new Map<string, ScrapedLead>(
      incoming.map((l) => [l.website || l.company + "\0" + l.name, l])
    );
    return prev.map((l) => {
      const enriched = map.get(l.website || l.company + "\0" + l.name);
      if (!enriched) return l;
      return {
        ...l,
        enriched_email:  enriched.enriched_email  || l.enriched_email,
        enriched_phone:  enriched.enriched_phone  || l.enriched_phone,
        enriched_mobile: enriched.enriched_mobile || l.enriched_mobile,
        email:  enriched.email  || l.email,
        phone:  enriched.phone  || l.phone,
        mobile: enriched.mobile || l.mobile,
        decision_maker: l.decision_maker || enriched.decision_maker,
      };
    });
  }, []);

  const enrich = useCallback(async () => {
    if (!leads.length) { setEnrichError("No leads — run Scrape first"); return; }
    setEnriching(true); setEnrichError("");
    try {
      const res  = await fetch("/api/engine/leads/enrich", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
        signal: AbortSignal.timeout(180_000),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => mergeEnriched(data.leads ?? [], prev));
        setEnrichCount(data.enrichedCount ?? 0);
        onDone();
      } else { setEnrichError(data.error ?? "Enrichment failed"); }
    } catch (e: unknown) {
      setEnrichError(e instanceof Error && e.name === "TimeoutError" ? "Enrichment timed out — try a smaller batch (≤20 leads)" : "Network error — enrichment failed");
    } finally { setEnriching(false); }
  }, [leads, setLeads, mergeEnriched, onDone]);

  return { enriching, enrichError, enrichCount, enrich, mergeEnriched };
}

// ─── useContactsActions ───────────────────────────────────────────────────────
export function useContactsActions(
  leads: ScrapedLead[],
  setLeads: React.Dispatch<React.SetStateAction<ScrapedLead[]>>,
  mergeEnriched: (incoming: ScrapedLead[], prev: ScrapedLead[]) => ScrapedLead[],
  onDone: () => void,
) {
  const [contactsEnriching, setContactsEnriching] = useState(false);
  const [contactsError, setContactsError]         = useState("");
  const [contactsEnrichCount, setContactsEnrichCount] = useState(0);
  const [dmFinding, setDmFinding] = useState(false);
  const [dmError, setDmError]     = useState("");
  const [dmCount, setDmCount]     = useState(0);

  const fillContactGaps = useCallback(async () => {
    const incomplete = leads.filter((l) => !l.email || !l.phone);
    if (!incomplete.length) { onDone(); return; }
    setContactsEnriching(true); setContactsError("");
    try {
      const res  = await fetch("/api/engine/leads/enrich", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: incomplete }),
        signal: AbortSignal.timeout(180_000),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => mergeEnriched(data.leads ?? [], prev));
        setContactsEnrichCount(data.enrichedCount ?? 0);
      } else { setContactsError(data.error ?? "Enrichment failed"); }
    } catch (e: unknown) {
      setContactsError(e instanceof Error && e.name === "TimeoutError" ? "Timed out — try a smaller batch" : "Network error");
    } finally { setContactsEnriching(false); }
  }, [leads, setLeads, mergeEnriched, onDone]);

  const findDecisionMakers = useCallback(async () => {
    const needsDM = leads.filter((l) => !l.decision_maker);
    if (!needsDM.length) return;
    setDmFinding(true); setDmError("");
    try {
      const res  = await fetch("/api/engine/leads/apollo-dm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: needsDM }),
        signal: AbortSignal.timeout(300_000),
      });
      const data = await res.json();
      if (data.success) {
        const map = new Map<string, ScrapedLead>(
          (data.leads ?? []).map((l: ScrapedLead) => [l.website || l.company + "\0" + l.name, l])
        );
        setLeads((prev) => prev.map((l) => map.get(l.website || l.company + "\0" + l.name) ?? l));
        setDmCount(data.enrichedCount ?? 0);
      } else { setDmError(data.error ?? "Apollo search failed"); }
    } catch (e: unknown) {
      setDmError(e instanceof Error && e.name === "TimeoutError" ? "Timed out — Apollo can be slow for large batches" : "Network error");
    } finally { setDmFinding(false); }
  }, [leads, setLeads]);

  return {
    contactsEnriching, contactsError, contactsEnrichCount,
    dmFinding, dmError, dmCount,
    fillContactGaps, findDecisionMakers,
  };
}

// ─── useImportActions ─────────────────────────────────────────────────────────
export function useImportActions(
  leads: ScrapedLead[],
  selected: Set<number>,
  setSelected: React.Dispatch<React.SetStateAction<Set<number>>>,
) {
  const [importing, setImporting] = useState(false);
  const [imported, setImported]   = useState(0);
  const [skipped, setSkipped]     = useState(0);
  const [importError, setImportError] = useState("");

  const toggleAll = useCallback(() => {
    setSelected((prev) => prev.size === leads.length ? new Set() : new Set(leads.map((_, i) => i)));
  }, [leads, setSelected]);

  const toggle = useCallback((i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, [setSelected]);

  const importSelected = useCallback(async () => {
    const toImport = Array.from(selected).map((i) => leads[i]);
    if (!toImport.length) return;
    setImporting(true); setImportError("");
    try {
      const res  = await fetch("/api/engine/leads/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toImport }),
        signal: AbortSignal.timeout(30_000),
      });
      const data = await res.json();
      if (data.success) { setImported(data.imported); setSkipped(data.skipped ?? 0); setSelected(new Set()); }
      else { setImportError(data.error ?? "Import failed"); }
    } catch (e: unknown) {
      setImportError(e instanceof Error && e.name === "TimeoutError" ? "Import timed out — please retry" : "Network error — import failed");
    } finally { setImporting(false); }
  }, [leads, selected, setSelected]);

  return { importing, imported, skipped, importError, toggleAll, toggle, importSelected };
}

// ─── useApiHealth ─────────────────────────────────────────────────────────────
export type ApiHealth = {
  crm:   { status: "ok" | "error" | "checking"; detail: string };
  apify: { status: "ok" | "error" | "checking"; detail: string };
};

export function useApiHealth() {
  const [health, setHealth] = useState<ApiHealth>({
    crm:   { status: "checking", detail: "" },
    apify: { status: "checking", detail: "" },
  });

  const checkHealth = useCallback(async () => {
    setHealth({ crm: { status: "checking", detail: "" }, apify: { status: "checking", detail: "" } });
    try {
      const res  = await fetch("/api/engine/crm?count=1", { signal: AbortSignal.timeout(8_000) });
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
    try {
      const res  = await fetch("/api/engine/leads/scrape", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "compass/crawler-google-places", input: {}, maxItems: 0, _healthCheck: true }),
        signal: AbortSignal.timeout(10_000),
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

  return { health, checkHealth };
}

// ─── usePipelineLeads — shared leads + selection state ────────────────────────
export function usePipelineLeads() {
  const [leads, setLeads]     = useState<ScrapedLead[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [tab, setTab]           = useState<PipelineTab>("scrape");
  return { leads, setLeads, selected, setSelected, tab, setTab };
}

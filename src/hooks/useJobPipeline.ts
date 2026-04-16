"use client";

import { useState, useCallback } from "react";
import type {
  JobLead, JobSource, JobPipelineTab, JobSearchForm, EnrichMethod,
} from "@/app/engine/jobs/types";
import { JOB_SOURCES } from "@/app/engine/jobs/types";

/** Hydrate a raw scraped job (no id/status) into a full JobLead with temp client-side ID */
function hydrateScrapedJob(raw: Record<string, unknown>): JobLead {
  return {
    id:                  (raw.id as string) || crypto.randomUUID(),
    source_id:           (raw.source_id as string) || "",
    source:              (raw.source as JobSource) || "seek",
    job_title:           (raw.job_title as string) || "Untitled",
    job_url:             (raw.job_url as string) || null,
    company_name:        (raw.company_name as string) || null,
    company_website:     (raw.company_website as string) || null,
    company_industry:    (raw.company_industry as string) || null,
    company_size:        (raw.company_size as string) || null,
    location:            (raw.location as string) || null,
    country:             (raw.country as string) || null,
    salary:              (raw.salary as string) || null,
    work_type:           (raw.work_type as string) || null,
    work_arrangement:    (raw.work_arrangement as string) || null,
    description:         (raw.description as string) || null,
    emails:              Array.isArray(raw.emails) ? raw.emails : [],
    phone_numbers:       Array.isArray(raw.phone_numbers) ? raw.phone_numbers : [],
    recruiter_name:      (raw.recruiter_name as string) || null,
    recruiter_phone:     (raw.recruiter_phone as string) || null,
    recruiter_agency:    (raw.recruiter_agency as string) || null,
    recruiter_website:   (raw.recruiter_website as string) || null,
    ai_company_summary:  null,
    ai_hiring_signal:    null,
    ai_relevance_score:  null,
    ai_relevance_reason: null,
    ai_suggested_dm_title: null,
    ai_enriched_at:      null,
    dm_name:             null,
    dm_title:            null,
    dm_email:            null,
    dm_phone:            null,
    dm_mobile:           null,
    dm_linkedin_url:     null,
    dm_enriched_at:      null,
    li_company_url:      null,
    li_company_desc:     null,
    li_company_size:     null,
    li_industry:         null,
    li_hq_location:      null,
    li_enriched_at:      null,
    status:              "new",
    search_query:        null,
    listed_at:           (raw.listed_at as string) || null,
    expires_at:          (raw.expires_at as string) || null,
    created_at:          new Date().toISOString(),
    updated_at:          new Date().toISOString(),
  };
}

// ── useJobScrape ─────────────────────────────────────────────────────────────

export function useJobScrape(onDone: (jobs: JobLead[]) => void) {
  const [form, setForm] = useState<JobSearchForm>({
    source: "seek",
    searchTerm: "",
    location: "",
    country: "AU",
    maxResults: 50,
    dateRange: 7,
    workType: "",
  });
  const [scraping, setScraping]       = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [saveMsg, setSaveMsg]         = useState("");

  const selectedSource = JOB_SOURCES.find((s) => s.id === form.source) ?? JOB_SOURCES[0];

  const setSource = useCallback((source: JobSource) => {
    const def = JOB_SOURCES.find((s) => s.id === source);
    setForm((f: JobSearchForm) => ({ ...f, source, country: def?.defaultCountry ?? f.country }));
  }, []);

  const updateForm = useCallback((patch: Partial<JobSearchForm>) => {
    setForm((f: JobSearchForm) => ({ ...f, ...patch }));
  }, []);

  const scrape = useCallback(async () => {
    if (!form.searchTerm.trim()) { setScrapeError("Enter a search term"); return; }
    setScraping(true); setScrapeError(""); setSaveMsg("");
    try {
      const res = await fetch("/api/engine/jobs/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: AbortSignal.timeout(170_000),
      });
      const data = await res.json();
      if (!data.success) { setScrapeError(data.error ?? "Scrape failed"); return; }

      const rawJobs = (data.jobs ?? []) as Record<string, unknown>[];
      if (rawJobs.length === 0) { setScrapeError("No jobs found — try different keywords"); return; }
      const jobs: JobLead[] = rawJobs.map(hydrateScrapedJob);

      // Auto-save to DB
      setSaveMsg("Saving to database…");
      try {
        const saveRes = await fetch("/api/engine/jobs/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobs, searchQuery: form.searchTerm }),
          signal: AbortSignal.timeout(30_000),
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
          setSaveMsg(
            `Saved ${saveData.imported} jobs${saveData.skipped ? ` (${saveData.skipped} duplicates skipped)` : ""}`,
          );
        }
      } catch { /* non-fatal */ }

      onDone(jobs);
    } catch (e: unknown) {
      setScrapeError(
        e instanceof Error && e.name === "TimeoutError"
          ? "Scrape timed out — try fewer results"
          : "Network error — scrape failed",
      );
    } finally { setScraping(false); }
  }, [form, onDone]);

  return {
    form, setSource, updateForm, selectedSource,
    scraping, scrapeError, saveMsg,
    scrape,
  };
}

// ── useJobList ───────────────────────────────────────────────────────────────

export function useJobList() {
  const [jobs, setJobs]       = useState<JobLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount]     = useState(0);
  const [listError, setListError] = useState("");

  const fetchJobs = useCallback(async (filters?: {
    status?: string; source?: string; country?: string; search?: string;
  }) => {
    setLoading(true);
    setListError("");
    try {
      const params = new URLSearchParams();
      if (filters?.status)  params.set("status", filters.status);
      if (filters?.source)  params.set("source", filters.source);
      if (filters?.country) params.set("country", filters.country);
      if (filters?.search)  params.set("search", filters.search);
      params.set("limit", "200");

      const res = await fetch(`/api/engine/jobs?${params}`, { signal: AbortSignal.timeout(10_000) });
      const data = await res.json();
      if (!res.ok) { setListError(data.error ?? "Failed to load jobs"); return; }
      setJobs(data.jobs ?? []);
      setCount(data.count ?? 0);
    } catch (e: unknown) {
      setListError(
        e instanceof Error && e.name === "TimeoutError"
          ? "Request timed out — try again"
          : "Network error — failed to load jobs",
      );
    } finally { setLoading(false); }
  }, []);

  return { jobs, setJobs, loading, count, listError, fetchJobs };
}

// ── useJobEnrich ─────────────────────────────────────────────────────────────

export function useJobEnrich(
  jobs: JobLead[],
  setJobs: (updater: (prev: JobLead[]) => JobLead[]) => void,
) {
  const [enriching, setEnriching]   = useState(false);
  const [enrichMethod, setEnrichMethod] = useState<EnrichMethod | null>(null);
  const [enrichError, setEnrichError] = useState("");
  const [enrichCount, setEnrichCount] = useState(0);

  const enrich = useCallback(async (method: EnrichMethod, selectedIds: Set<string>) => {
    const selected = jobs.filter((j) => selectedIds.has(j.id));
    if (!selected.length) { setEnrichError("Select jobs to enrich first"); return; }

    setEnriching(true); setEnrichMethod(method); setEnrichError("");
    try {
      const res = await fetch("/api/engine/jobs/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: selected, method }),
        signal: AbortSignal.timeout(290_000),
      });
      const data = await res.json();
      if (!data.success) { setEnrichError(data.error ?? "Enrichment failed"); return; }

      const enrichments = data.enrichments as Record<string, Record<string, unknown>>;
      setEnrichCount(data.enrichedCount ?? 0);

      // Merge enrichments into local state
      setJobs((prev: JobLead[]) =>
        prev.map((j: JobLead) => {
          const e = enrichments[j.id];
          if (!e) return j;
          return { ...j, ...e } as JobLead;
        }),
      );

      // Persist enrichments to DB
      for (const [id, fields] of Object.entries(enrichments)) {
        // Compute new status
        const job = jobs.find((j) => j.id === id);
        const merged = { ...job, ...fields };
        let newStatus = job?.status ?? "new";
        if (method === "ai" && newStatus === "new") newStatus = "ai_enriched";
        if (method === "apollo" && (newStatus === "new" || newStatus === "ai_enriched")) newStatus = "dm_enriched";
        if (merged.ai_enriched_at && merged.dm_enriched_at && merged.li_enriched_at) newStatus = "fully_enriched";

        fetch(`/api/engine/jobs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fields, status: newStatus }),
        }).catch(() => {});
      }
    } catch (e: unknown) {
      setEnrichError(
        e instanceof Error && e.name === "TimeoutError"
          ? "Enrichment timed out — try a smaller batch"
          : "Network error — enrichment failed",
      );
    } finally { setEnriching(false); setEnrichMethod(null); }
  }, [jobs, setJobs]);

  return { enriching, enrichMethod, enrichError, enrichCount, enrich };
}

// ── useJobPushToCrm ──────────────────────────────────────────────────────────

export function useJobPushToCrm(
  setJobs: (updater: (prev: JobLead[]) => JobLead[]) => void,
) {
  const [pushing, setPushing]     = useState(false);
  const [pushResult, setPushResult] = useState("");

  const pushToCrm = useCallback(async (selectedIds: Set<string>) => {
    if (!selectedIds.size) return;
    setPushing(true); setPushResult("");
    try {
      const res = await fetch("/api/engine/jobs/push-to-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: Array.from(selectedIds) }),
        signal: AbortSignal.timeout(30_000),
      });
      const data = await res.json();
      if (data.success) {
        setPushResult(`Pushed ${data.imported} to CRM${data.skipped ? ` (${data.skipped} duplicates)` : ""}`);
        setJobs((prev: JobLead[]) =>
          prev.map((j: JobLead) =>
            selectedIds.has(j.id) ? { ...j, status: "pushed_to_crm" as const } : j,
          ),
        );
      } else {
        setPushResult(`Error: ${data.error ?? "Push failed"}`);
      }
    } catch {
      setPushResult("Network error — push failed");
    } finally { setPushing(false); }
  }, [setJobs]);

  const dismiss = useCallback(async (selectedIds: Set<string>) => {
    for (const id of selectedIds) {
      fetch(`/api/engine/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      }).catch(() => {});
    }
    setJobs((prev: JobLead[]) =>
      prev.map((j: JobLead) =>
        selectedIds.has(j.id) ? { ...j, status: "dismissed" as const } : j,
      ),
    );
  }, [setJobs]);

  return { pushing, pushResult, pushToCrm, dismiss };
}

// ── useJobPipelineState — shared state ───────────────────────────────────────

export function useJobPipelineState() {
  const [tab, setTab]         = useState<JobPipelineTab>("scrape");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleAll = useCallback((jobs: JobLead[]) => {
    setSelected((prev: Set<string>) =>
      prev.size === jobs.length ? new Set<string>() : new Set(jobs.map((j) => j.id)),
    );
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev: Set<string>) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return { tab, setTab, selected, setSelected, toggleAll, toggle };
}

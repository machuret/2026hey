"use client";

import { useState, useCallback } from "react";
import type {
  JobLead, JobSource, JobSearchForm, EnrichMethod,
} from "@/app/engine/jobs/types";
import { JOB_SOURCES } from "@/app/engine/jobs/types";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

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
    job_category:        (raw.job_category as string) || null,
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
    ai_poster_type:      null,
    ai_poster_reason:    null,
    ai_role_seniority:   null,
    ai_role_function:    null,
    ai_required_skills:  [],
    ai_required_experience: null,
    ai_required_certifications: [],
    ai_employment_type:  null,
    ai_urgency:          null,
    ai_urgency_clues:    null,
    ai_team_size_clue:   null,
    ai_reports_to:       null,
    ai_company_pain_points: null,
    ai_work_model:       null,
    ai_industry_vertical: null,
    ai_salary_normalized: null,
    ai_benefits_summary: null,
    ai_candidate_persona: null,
    ai_pitch_angle:      null,
    ai_email_snippet:    null,
    ai_objection_preempt: null,
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
    ai_attempts:         0,
    dm_attempts:         0,
    li_attempts:         0,
    ai_failure_reason:   null,
    dm_failure_reason:   null,
    li_failure_reason:   null,
    last_error:          null,
    next_retry_at:       null,
    total_cost_usd:      0,
    status:              "new",
    search_query:        null,
    listed_at:           (raw.listed_at as string) || null,
    expires_at:          (raw.expires_at as string) || null,
    created_at:          new Date().toISOString(),
    updated_at:          new Date().toISOString(),
  };
}

// ── useJobScrape ─────────────────────────────────────────────────────────────

export function useJobScrape(
  onDone: (jobs: JobLead[]) => void,
  onClearJobs: () => void,
  /** Optional signal for external cancellation (e.g. AutoPilot) */
  externalSignal?: AbortSignal,
) {
  const [form, setForm] = useState<JobSearchForm>({
    source: "seek",
    searchTerm: "",
    locations: [],
    country: "AU",
    maxResults: 50,
    dateRange: 7,
    workType: "",
    industry: "",
  });
  const [scraping, setScraping]       = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [saveMsg, setSaveMsg]         = useState("");
  const [scrapeProgress, setScrapeProgress] = useState("");

  const selectedSource = JOB_SOURCES.find((s) => s.id === form.source) ?? JOB_SOURCES[0];

  const setSource = useCallback((source: JobSource) => {
    const def = JOB_SOURCES.find((s) => s.id === source);
    setForm((f: JobSearchForm) => ({ ...f, source, country: def?.defaultCountry ?? f.country }));
  }, []);

  const updateForm = useCallback((patch: Partial<JobSearchForm>) => {
    setForm((f: JobSearchForm) => ({ ...f, ...patch }));
  }, []);

  const [saving, setSaving] = useState(false);
  const [scrapeCost, setScrapeCost] = useState<number | null>(null);

  /** Scrape a single city and auto-save to DB. Returns hydrated jobs (with real DB IDs). */
  const scrapeCity = useCallback(async (city: string, formSnapshot: JobSearchForm): Promise<{
    jobs: JobLead[];
    cost: number;
    error?: string;
  }> => {
    const payload = { ...formSnapshot, location: city, locations: undefined };
    const res = await fetch("/api/engine/jobs/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: externalSignal ?? AbortSignal.timeout(170_000),
    });
    const data = await res.json();
    if (!data.success) {
      return { jobs: [], cost: 0, error: `[${res.status}] ${data.error ?? "Scrape failed"}` };
    }

    const cost = Number(data.costUsd ?? 0);
    const rawJobs = (data.jobs ?? []) as Record<string, unknown>[];
    if (rawJobs.length === 0) return { jobs: [], cost };

    // Hydrate with temp UUIDs (will be replaced by DB IDs after save)
    const hydrated: JobLead[] = rawJobs.map((raw) => ({
      ...hydrateScrapedJob(raw),
      job_category: formSnapshot.industry || null,
    }));

    // Auto-save this city's batch to DB immediately — eliminates data loss on tab close
    try {
      const saveRes = await fetch("/api/engine/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: hydrated, searchQuery: formSnapshot.searchTerm }),
        signal: externalSignal ?? AbortSignal.timeout(30_000),
      });
      const saveData = await saveRes.json();

      // Replace temp UUIDs with real DB rows where available (match by source+source_id)
      const inserted = (saveData.inserted ?? []) as JobLead[];
      const byKey = new Map(inserted.map((r) => [`${r.source}::${r.source_id}`, r]));
      const withDbIds = hydrated.map((j) => byKey.get(`${j.source}::${j.source_id}`) ?? j);
      return { jobs: withDbIds, cost };
    } catch (saveErr) {
      // Scrape succeeded but save failed — return scraped jobs with temp IDs so user sees them
      console.error("[scrapeCity] auto-save failed:", saveErr);
      return { jobs: hydrated, cost, error: `Auto-save failed for ${city || "location"}: ${extractErrorMsg(saveErr)}` };
    }
  }, [externalSignal]);

  const scrape = useCallback(async () => {
    if (!form.searchTerm.trim()) { setScrapeError("Enter a search term"); return; }
    const cities = form.locations.length > 0 ? form.locations : [""];

    onClearJobs();
    setScraping(true); setScrapeError(""); setSaveMsg(""); setScrapeCost(null); setScrapeProgress("");

    const formSnapshot = form;
    const allJobs: JobLead[] = [];
    let totalCost = 0;
    let totalImported = 0;
    let completed = 0;
    const errors: string[] = [];

    // Concurrency control — max 3 cities in flight at once
    const CONCURRENCY = 3;
    let idx = 0;

    const updateProgress = () => {
      setScrapeProgress(
        cities.length > 1
          ? `Scraped ${completed}/${cities.length} cities — ${allJobs.length} jobs saved`
          : `Scraping jobs…`,
      );
    };
    updateProgress();

    async function worker() {
      while (idx < cities.length) {
        const myIdx = idx++;
        const city = cities[myIdx];
        const result = await scrapeCity(city, formSnapshot);
        if (result.error) errors.push(result.error);
        allJobs.push(...result.jobs);
        totalCost += result.cost;
        totalImported += result.jobs.length;
        completed++;
        updateProgress();
      }
    }

    try {
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, cities.length) }, () => worker()),
      );

      if (totalCost > 0) setScrapeCost(totalCost);

      // Dedup by source_id across cities (already DB-deduped, but belt-and-braces)
      const seen = new Set<string>();
      const unique = allJobs.filter((j) => {
        const key = `${j.source}::${j.source_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (unique.length === 0) {
        setScrapeError(errors.length ? errors.join(" | ") : "No jobs found — try different keywords or cities");
        return;
      }

      if (errors.length) setScrapeError(`Partial success: ${errors.join(" | ")}`);
      setSaveMsg(`✓ Scraped + saved ${totalImported} jobs from ${cities.length} cit${cities.length === 1 ? "y" : "ies"}`);
      onDone(unique);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      if (e instanceof Error && e.name === "TimeoutError") {
        setScrapeError("Scrape timed out (170s) — try fewer results");
      } else {
        setScrapeError(`Scrape failed: ${extractErrorMsg(e)}`);
      }
    } finally { setScraping(false); setScrapeProgress(""); }
  }, [form, onDone, onClearJobs, scrapeCity]);

  /** Legacy manual save — kept for backward compat if called explicitly, but scrape() now auto-saves per city. */
  const saveJobs = useCallback(async (jobs: JobLead[]) => {
    if (!jobs.length) return;
    setSaving(true); setSaveMsg("Saving to database…");
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
      } else {
        setSaveMsg(`⚠ Save failed: ${extractErrorMsg(saveData.error)}`);
      }
    } catch (e) {
      setSaveMsg(`⚠ Save to database failed: ${extractErrorMsg(e)}`);
    } finally { setSaving(false); }
  }, [form.searchTerm]);

  return {
    form, setSource, updateForm, selectedSource,
    scraping, scrapeError, scrapeProgress, saveMsg, saving, scrapeCost,
    scrape, saveJobs,
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
      params.set("limit", "500");

      const res = await fetch(`/api/engine/jobs?${params}`, { signal: AbortSignal.timeout(15_000) });
      const data = await res.json();
      if (!res.ok) { setListError(data.error ?? "Failed to load jobs"); return; }
      const fetchedJobs = data.jobs ?? [];
      const totalCount = data.count ?? 0;
      setJobs(fetchedJobs);
      setCount(totalCount);
      // Warn if there are more jobs than we fetched (pagination needed)
      if (totalCount > fetchedJobs.length) {
        setListError(`Showing ${fetchedJobs.length} of ${totalCount} jobs — use filters to narrow results`);
      }
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

/** Pipeline step descriptor */
export type EnrichStep = {
  method: EnrichMethod;
  label: string;
  done: boolean;
  count: number;
};

const PIPELINE_STEPS: { method: EnrichMethod; label: string }[] = [
  { method: "ai",       label: "AI Analysis" },
  { method: "apollo",   label: "Decision Makers" },
  { method: "linkedin", label: "LinkedIn Intel" },
];

const BATCH_SIZE = 50;

/** Trim a JobLead to only the fields the edge function needs — pure function, no state */
function trimForEnrich(j: JobLead) {
  return {
    id: j.id,
    company_name: j.company_name,
    company_website: j.company_website,
    company_industry: j.company_industry,
    company_size: j.company_size,
    description: j.description ? j.description.slice(0, 5000) : null,
    job_title: j.job_title,
    location: j.location,
    country: j.country,
    salary: j.salary,
    work_type: j.work_type,
    work_arrangement: j.work_arrangement,
    emails: j.emails ?? [],
    phone_numbers: j.phone_numbers ?? [],
    recruiter_name: j.recruiter_name,
    recruiter_agency: j.recruiter_agency,
    recruiter_website: j.recruiter_website,
    listed_at: j.listed_at,
  };
}

/** Split an array into chunks of a given size */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function useJobEnrich(
  jobs: JobLead[],
  setJobs: (updater: (prev: JobLead[]) => JobLead[]) => void,
) {
  const [enriching, setEnriching]         = useState(false);
  const [enrichMethod, setEnrichMethod]   = useState<EnrichMethod | null>(null);
  const [enrichError, setEnrichError]     = useState("");
  const [enrichCount, setEnrichCount]     = useState(0);
  const [enrichCost, setEnrichCost]       = useState<number | null>(null);
  const [enrichSaveMsg, setEnrichSaveMsg] = useState("");
  // Progress for full pipeline
  const [pipelineSteps, setPipelineSteps] = useState<EnrichStep[]>([]);
  const [pipelineProgress, setPipelineProgress] = useState(0); // 0-100
  const [pipelineBatchMsg, setPipelineBatchMsg] = useState("");

  /** Run a single enrichment method on a batch of jobs, returns patches */
  const enrichBatch = useCallback(async (
    batch: JobLead[],
    method: EnrichMethod,
  ): Promise<{ patches: { id: string; body: Record<string, unknown> }[]; cost: number; recruiterDismissed: number }> => {
    const trimmed = batch.map(trimForEnrich);
    const res = await fetch("/api/engine/jobs/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobs: trimmed, method }),
      signal: AbortSignal.timeout(290_000),
    });

    // Handle non-JSON responses (502, HTML error pages, etc.)
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text().catch(() => "");
      throw new Error(`[${res.status}] Server error: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(`[${res.status}] ${extractErrorMsg(data.error)}`);
    }

    const enrichments = data.enrichments as Record<string, Record<string, unknown>>;
    const jobMap = new Map(batch.map((j) => [j.id, j]));
    const patches: { id: string; body: Record<string, unknown> }[] = [];
    let recruiterDismissed = 0;

    for (const [id, fields] of Object.entries(enrichments)) {
      const job = jobMap.get(id);
      const merged = { ...job, ...fields };
      let newStatus = job?.status ?? "new";

      if (method === "ai" && String(fields.ai_poster_type) === "agency_recruiter") {
        newStatus = "recruiter_dismissed";
        recruiterDismissed++;
      } else if (method === "ai" && newStatus === "new") {
        newStatus = "ai_enriched";
      }
      if (method === "apollo" && (newStatus === "new" || newStatus === "ai_enriched")) newStatus = "dm_enriched";
      if (merged.ai_enriched_at && merged.dm_enriched_at && merged.li_enriched_at) newStatus = "fully_enriched";
      patches.push({ id, body: { ...fields, status: newStatus } });
    }

    return { patches, cost: data.costUsd ?? 0, recruiterDismissed };
  }, []);

  /** Persist a single patch to DB with retry (up to 3 attempts, exponential backoff) */
  const patchWithRetry = useCallback(async (
    id: string,
    body: Record<string, unknown>,
    maxRetries = 2,
  ): Promise<void> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const r = await fetch(`/api/engine/jobs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        });
        if (r.ok) return;
        const err = new Error(`HTTP ${r.status}`);
        // Don't retry 4xx client errors (bad data won't fix itself)
        if (r.status >= 400 && r.status < 500) throw err;
        // 5xx — retry if attempts remain
        if (attempt === maxRetries) throw err;
      } catch (e) {
        if (attempt >= maxRetries) throw e;
        // Exponential backoff: 500ms, 1500ms
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }, []);

  /** Apply patches to local state + persist to DB with retry */
  const applyPatches = useCallback(async (
    patches: { id: string; body: Record<string, unknown> }[],
  ) => {
    if (!patches.length) return 0;
    const patchMap = new Map(patches.map((p) => [p.id, p.body]));
    setJobs((prev: JobLead[]) =>
      prev.map((j: JobLead) => {
        const body = patchMap.get(j.id);
        return body ? ({ ...j, ...body } as JobLead) : j;
      }),
    );
    const results = await Promise.allSettled(
      patches.map((p) => patchWithRetry(p.id, p.body)),
    );
    return results.filter((r) => r.status === "rejected").length;
  }, [setJobs, patchWithRetry]);

  /** Run enrichment for a single method (old-style individual button) */
  const enrich = useCallback(async (method: EnrichMethod, selectedIds: Set<string>) => {
    const selected = jobs.filter((j) => selectedIds.has(j.id));
    if (!selected.length) { setEnrichError("Select jobs to enrich first"); return; }

    setEnriching(true); setEnrichMethod(method); setEnrichError(""); setEnrichSaveMsg(""); setEnrichCost(null);
    setPipelineSteps([]); setPipelineProgress(0); setPipelineBatchMsg("");
    try {
      const batches = chunk(selected, BATCH_SIZE);
      let totalCost = 0;
      let totalEnriched = 0;
      let totalFailed = 0;
      let totalRecruiterDismissed = 0;

      for (let i = 0; i < batches.length; i++) {
        setPipelineBatchMsg(`Batch ${i + 1}/${batches.length} · ${method.toUpperCase()}…`);
        setPipelineProgress(Math.round(((i) / batches.length) * 100));

        const { patches, cost, recruiterDismissed } = await enrichBatch(batches[i], method);
        totalCost += cost;
        totalEnriched += patches.length;
        totalRecruiterDismissed += recruiterDismissed;
        const failed = await applyPatches(patches);
        totalFailed += failed;

        // Small pause between batches to avoid hammering
        if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 1500));
      }

      setPipelineProgress(100);
      setEnrichCount(totalEnriched);
      if (totalCost > 0) setEnrichCost(totalCost);

      if (totalFailed) {
        setEnrichError(`Enriched but ${totalFailed} save(s) failed — refresh to check`);
      } else {
        const parts = [`Auto-saved ${totalEnriched} enrichment(s) to database`];
        if (totalRecruiterDismissed > 0) parts.push(`${totalRecruiterDismissed} agency post(s) auto-dismissed`);
        setEnrichSaveMsg(parts.join(" · "));
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "TimeoutError") {
        setEnrichError("Enrichment timed out — try a smaller batch");
      } else {
        setEnrichError(`Enrichment failed: ${extractErrorMsg(e)}`);
      }
    } finally { setEnriching(false); setEnrichMethod(null); setPipelineBatchMsg(""); }
  }, [jobs, enrichBatch, applyPatches]);

  /** Run full pipeline: AI → Apollo → LinkedIn sequentially with auto-batching */
  const enrichAll = useCallback(async (selectedIds: Set<string>) => {
    // Filter only non-recruiter, non-dismissed jobs
    const selected = jobs.filter((j) => selectedIds.has(j.id) && j.status !== "recruiter_dismissed" && j.status !== "dismissed");
    if (!selected.length) { setEnrichError("No eligible jobs selected"); return; }

    setEnriching(true); setEnrichError(""); setEnrichSaveMsg(""); setEnrichCost(null); setEnrichCount(0);
    setPipelineBatchMsg("");

    const steps: EnrichStep[] = PIPELINE_STEPS.map((s) => ({ ...s, done: false, count: 0 }));
    setPipelineSteps([...steps]);
    setPipelineProgress(0);

    let totalCost = 0;
    let totalEnriched = 0;
    let totalFailed = 0;
    let totalRecruiterDismissed = 0;
    // Track IDs dismissed so we skip them in later steps
    const dismissedIds = new Set<string>();

    try {
      for (let si = 0; si < steps.length; si++) {
        const step = steps[si];
        setEnrichMethod(step.method);

        // For apollo/linkedin, skip already-dismissed jobs
        const eligible = selected.filter((j) => !dismissedIds.has(j.id));
        if (!eligible.length) { steps[si].done = true; setPipelineSteps([...steps]); continue; }

        const batches = chunk(eligible, BATCH_SIZE);
        const baseProgress = Math.round((si / steps.length) * 100);
        const stepWeight = 100 / steps.length;

        for (let bi = 0; bi < batches.length; bi++) {
          const batchProgress = baseProgress + Math.round(((bi) / batches.length) * stepWeight);
          setPipelineProgress(batchProgress);
          setPipelineBatchMsg(`${step.label} · Batch ${bi + 1}/${batches.length}`);

          const { patches, cost, recruiterDismissed } = await enrichBatch(batches[bi], step.method);
          totalCost += cost;
          totalEnriched += patches.length;
          totalRecruiterDismissed += recruiterDismissed;
          steps[si].count += patches.length;

          // Track dismissed IDs so we skip in later pipeline steps
          for (const p of patches) {
            if (String(p.body.status) === "recruiter_dismissed") dismissedIds.add(p.id);
          }

          const failed = await applyPatches(patches);
          totalFailed += failed;

          if (bi < batches.length - 1) await new Promise((r) => setTimeout(r, 1500));
        }

        steps[si].done = true;
        setPipelineSteps([...steps]);

        // Pause between pipeline steps
        if (si < steps.length - 1) await new Promise((r) => setTimeout(r, 2000));
      }

      setPipelineProgress(100);
      setEnrichCount(totalEnriched);
      if (totalCost > 0) setEnrichCost(totalCost);

      if (totalFailed) {
        setEnrichError(`Pipeline complete but ${totalFailed} save(s) failed`);
      } else {
        const parts = [`Full pipeline complete — ${totalEnriched} enrichments saved`];
        if (totalRecruiterDismissed > 0) parts.push(`${totalRecruiterDismissed} agency post(s) auto-dismissed`);
        setEnrichSaveMsg(parts.join(" · "));
      }
    } catch (e: unknown) {
      const step = steps.find((s) => !s.done);
      setEnrichError(`Pipeline failed at ${step?.label ?? "unknown"}: ${extractErrorMsg(e)}`);
    } finally { setEnriching(false); setEnrichMethod(null); setPipelineBatchMsg(""); }
  }, [jobs, enrichBatch, applyPatches]);

  return {
    enriching, enrichMethod, enrichError, enrichCount, enrichCost, enrichSaveMsg,
    pipelineSteps, pipelineProgress, pipelineBatchMsg,
    enrich, enrichAll,
  };
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
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/engine/jobs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "dismissed" }),
          signal: AbortSignal.timeout(10_000),
        }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); }),
      ),
    );
    const succeeded = new Set(ids.filter((_, i) => results[i].status === "fulfilled"));
    setJobs((prev: JobLead[]) =>
      prev.map((j: JobLead) =>
        succeeded.has(j.id) ? { ...j, status: "dismissed" as const } : j,
      ),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) setPushResult(`${failed} dismiss(es) failed — refresh to check`);
  }, [setJobs]);

  return { pushing, pushResult, pushToCrm, dismiss };
}

// ── useJobPipelineState — shared state ───────────────────────────────────────

export function useJobPipelineState() {
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

  return { selected, setSelected, toggleAll, toggle };
}

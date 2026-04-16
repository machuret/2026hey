// Edge Function: engine-jobs-scrape
// Multi-source job scraper — Seek (AU/NZ), Indeed (USA), LinkedIn (Global)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── Actor configs ────────────────────────────────────────────────────────────

type Source = "seek" | "indeed" | "linkedin";

const ACTORS: Record<Source, string> = {
  seek:     "websift/seek-job-scraper",
  indeed:   "misceres/indeed-scraper",
  linkedin: "bebity/linkedin-jobs-scraper",
};

function buildActorInput(
  source: Source,
  params: {
    searchTerm: string;
    location: string;
    country: string;
    maxResults: number;
    dateRange: number;
    workType: string;
  },
): Record<string, unknown> {
  switch (source) {
    case "seek":
      return {
        searchTerm: params.searchTerm,
        location: params.location || undefined,
        maxResults: params.maxResults,
        dateRange: params.dateRange || undefined,
        sortBy: "ListedDate",
        ...(params.workType ? { workType: [params.workType] } : {}),
      };
    case "indeed":
      return {
        position: params.searchTerm,
        location: params.location || undefined,
        country: params.country || "US",
        maxItems: params.maxResults,
        saveOnlyUniqueItems: true,
      };
    case "linkedin":
      return {
        title: params.searchTerm,
        location: params.location || undefined,
        rows: params.maxResults,
      };
    default:
      return { searchTerm: params.searchTerm };
  }
}

// ── Normalizers — map actor output to our unified job shape ─────────────────

type NormalizedJob = {
  source_id: string;
  source: Source;
  job_title: string;
  job_url: string | null;
  company_name: string | null;
  company_website: string | null;
  company_industry: string | null;
  company_size: string | null;
  location: string | null;
  country: string | null;
  salary: string | null;
  work_type: string | null;
  work_arrangement: string | null;
  description: string | null;
  emails: string[];
  phone_numbers: string[];
  recruiter_name: string | null;
  recruiter_phone: string | null;
  recruiter_agency: string | null;
  recruiter_website: string | null;
  listed_at: string | null;
  expires_at: string | null;
};

function str(v: unknown): string {
  if (v === null || v === undefined || v === "N/A") return "";
  return String(v);
}

/** Convert empty string to null for nullable DB columns */
function nullable(v: string): string | null {
  return v || null;
}

function normalizeSeek(item: Record<string, unknown>, country: string): NormalizedJob {
  const loc = item.joblocationInfo as Record<string, unknown> | undefined;
  const adv = item.advertiser as Record<string, unknown> | undefined;
  const cp  = item.companyProfile as Record<string, unknown> | undefined;
  const rp  = item.recruiterProfile as Record<string, unknown> | undefined;
  const cls = item.classificationInfo as Record<string, unknown> | undefined;

  return {
    source_id:        str(item.id || item.jobId || item.jobLink),
    source:           "seek",
    job_title:        str(item.title),
    job_url:          nullable(str(item.jobLink)),
    company_name:     nullable(str(adv?.name ?? cp?.name)),
    company_website:  nullable(str(cp?.website ?? rp?.agencyWebsite)),
    company_industry: nullable(str(cp?.industry ?? cls?.classification)),
    company_size:     nullable(str(cp?.size)),
    location:         nullable(str(loc?.displayLocation ?? loc?.location)),
    country:          nullable(str(loc?.countryCode ?? country)),
    salary:           nullable(str(item.salary)),
    work_type:        nullable(str(item.workTypes)),
    work_arrangement: nullable(str(item.workArrangements)),
    description:      nullable(str((item.content as Record<string, unknown>)?.unEditedContent ?? "")),
    emails:           Array.isArray(item.emails) ? item.emails.map(String) : [],
    phone_numbers:    Array.isArray(item.phoneNumbers) ? item.phoneNumbers.map(String) : [],
    recruiter_name:   nullable(str(rp?.name)),
    recruiter_phone:  nullable(str(rp?.contactNumber)),
    recruiter_agency: nullable(str(rp?.agencyName)),
    recruiter_website: nullable(str(rp?.agencyWebsite)),
    listed_at:        nullable(str(item.listedAt)),
    expires_at:       nullable(str(item.expiresAtUtc)),
  };
}

function normalizeIndeed(item: Record<string, unknown>, country: string): NormalizedJob {
  return {
    source_id:        str(item.id || item.externalId || item.url),
    source:           "indeed",
    job_title:        str(item.positionName),
    job_url:          nullable(str(item.url)),
    company_name:     nullable(str(item.company)),
    company_website:  null,
    company_industry: null,
    company_size:     null,
    location:         nullable(str(item.location)),
    country:          country,
    salary:           nullable(str(item.salary)),
    work_type:        nullable(Array.isArray(item.jobType) ? item.jobType.join(", ") : str(item.jobType)),
    work_arrangement: null,
    description:      nullable(str(item.description)),
    emails:           [],
    phone_numbers:    [],
    recruiter_name:   null,
    recruiter_phone:  null,
    recruiter_agency: null,
    recruiter_website: null,
    listed_at:        nullable(str(item.postedAt)),
    expires_at:       null,
  };
}

function normalizeLinkedIn(item: Record<string, unknown>, country: string): NormalizedJob {
  return {
    source_id:        str(item.id ?? item.jobUrl ?? item.link ?? item.url),
    source:           "linkedin",
    job_title:        str(item.title ?? item.position),
    job_url:          nullable(str(item.jobUrl ?? item.link ?? item.url)),
    company_name:     nullable(str(item.company ?? item.companyName)),
    company_website:  nullable(str(item.companyUrl ?? "")),
    company_industry: null,
    company_size:     null,
    location:         nullable(str(item.location ?? item.place)),
    country:          country,
    salary:           nullable(str(item.salary ?? "")),
    work_type:        nullable(str(item.contractType ?? item.type ?? "")),
    work_arrangement: nullable(str(item.workType ?? "")),
    description:      nullable(str(item.description ?? "")),
    emails:           [],
    phone_numbers:    [],
    recruiter_name:   null,
    recruiter_phone:  null,
    recruiter_agency: null,
    recruiter_website: null,
    listed_at:        nullable(str(item.publishedAt ?? item.postedTime ?? "")),
    expires_at:       null,
  };
}

const NORMALIZERS: Record<Source, (item: Record<string, unknown>, country: string) => NormalizedJob> = {
  seek:     normalizeSeek,
  indeed:   normalizeIndeed,
  linkedin: normalizeLinkedIn,
};

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!APIFY_API_KEY) return json({ error: "APIFY_API_KEY not configured" }, 500);

  const body = await req.json();
  const {
    source = "seek",
    searchTerm = "",
    location = "",
    country = "AU",
    maxResults = 50,
    dateRange = 7,
    workType = "",
  } = body;

  if (!searchTerm.trim()) return json({ error: "searchTerm is required" }, 400);

  const src = source as Source;
  const actorId = ACTORS[src];
  if (!actorId) return json({ error: `Unknown source: ${source}` }, 400);

  const actorSlug = actorId.replaceAll("/", "~");
  const input = buildActorInput(src, { searchTerm, location, country, maxResults, dateRange, workType });

  try {
    // 1. Start the Apify actor run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${actorSlug}/runs?token=${APIFY_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!startRes.ok) {
      const err = await startRes.text();
      return json({ error: `Apify start failed: ${err.slice(0, 300)}` }, 502);
    }

    const { data: run } = await startRes.json();
    const runId = run?.id;
    if (!runId) return json({ error: "No run ID returned from Apify" }, 502);

    // 2. Poll until finished (max 120s)
    const pollStart = Date.now();
    let status = "RUNNING";
    let costUsd = 0;
    while (status === "RUNNING" || status === "READY") {
      if (Date.now() - pollStart > 120_000) return json({ error: "Apify run timed out (120s)" }, 504);
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`,
        { signal: AbortSignal.timeout(10000) },
      );
      const { data: runData } = await statusRes.json();
      status = runData?.status ?? "FAILED";
      if (runData?.usageTotalUsd) costUsd = Number(runData.usageTotalUsd);
    }

    if (status !== "SUCCEEDED") return json({ error: `Apify run ended with status: ${status}` }, 502);

    // 3. Fetch dataset items
    const datasetRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_KEY}&limit=${maxResults}&clean=true`,
      { signal: AbortSignal.timeout(15000) },
    );
    const items = await datasetRes.json();

    // 4. Normalize to unified job shape
    const normalize = NORMALIZERS[src];
    const jobs = (Array.isArray(items) ? items : [])
      .map((item: Record<string, unknown>) => normalize(item, country))
      .filter((j) => j.source_id && j.job_title);

    return json({ success: true, count: jobs.length, jobs, costUsd });
  } catch (err) {
    return json({ error: `Scrape failed: ${String(err)}` }, 500);
  }
});

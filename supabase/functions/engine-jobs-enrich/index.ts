// Edge Function: engine-jobs-enrich
// 3-mode enrichment for job leads:
//   method="ai"       — OpenAI analysis (company summary, hiring signal, relevance)
//   method="apollo"   — Apollo 2-step DM finder (email + phone)
//   method="linkedin" — LinkedIn company intel via Apify

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const APIFY_API_KEY  = Deno.env.get("APIFY_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── Shared Apify runner ──────────────────────────────────────────────────────

/** Mutable cost accumulator — created per request in the handler */
type CostCtx = { totalCostUsd: number };

/** Thrown when Apify itself is unreachable (timeout / 5xx / network) — NOT
 *  for "actor ran successfully but returned 0 items" (that's a legitimate
 *  empty result and we return []). Callers should treat this as transient
 *  and NOT increment attempt counters, so the job is retried next tick. */
class ApifyInfraError extends Error {
  constructor(msg: string, public actor: string, public statusCode?: number) {
    super(msg);
    this.name = "ApifyInfraError";
  }
}

async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutSecs = 60,
  costCtx?: CostCtx,
): Promise<Record<string, unknown>[]> {
  if (!APIFY_API_KEY) throw new ApifyInfraError("APIFY_API_KEY not configured", actorId);
  const slug = actorId.replaceAll("/", "~");
  const url = `https://api.apify.com/v2/acts/${slug}/run-sync-get-dataset-items?timeout=${timeoutSecs}`;

  // Retry transient failures up to 2 times with exponential backoff
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${APIFY_API_KEY}`,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout((timeoutSecs + 10) * 1000),
      });

      // Capture cost regardless of success
      if (costCtx) {
        const runCost = Number(res.headers.get("x-apify-usage-total-usd") ?? 0);
        if (runCost > 0) costCtx.totalCostUsd += runCost;
      }

      // 5xx → retry (transient infra)
      if (res.status >= 500) {
        lastErr = new ApifyInfraError(`HTTP ${res.status}`, slug, res.status);
        console.warn(`[apify] ${slug} attempt ${attempt}/${MAX_ATTEMPTS} → HTTP ${res.status}, retrying…`);
        if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      // 4xx → permanent (bad request / auth) — don't retry, treat as empty
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[apify] ${slug} HTTP ${res.status}: ${body.slice(0, 200)}`);
        return [];  // permanent error with this input — caller treats as "no results"
      }

      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      lastErr = e;
      const isTimeout = e instanceof Error && e.name === "TimeoutError";
      const isNetwork = e instanceof TypeError; // fetch network errors
      if (!(isTimeout || isNetwork)) {
        // Unknown error type — don't retry
        break;
      }
      console.warn(`[apify] ${slug} attempt ${attempt}/${MAX_ATTEMPTS}: ${isTimeout ? "timeout" : "network"}, retrying…`);
      if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  // All retries exhausted → throw so caller knows it was infra, not empty result
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new ApifyInfraError(`${slug} failed after ${MAX_ATTEMPTS} attempts: ${msg}`, slug);
}

// ── Concurrency helper ───────────────────────────────────────────────────────

const CONCURRENCY = 3;

async function withConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let active = 0;
  let idx = 0;
  await new Promise<void>((resolve, reject) => {
    function next() {
      while (active < CONCURRENCY && idx < items.length) {
        active++;
        const item = items[idx++];
        Promise.resolve()
          .then(() => fn(item))
          .catch((e) => console.error("[concurrency] item failed:", String(e)))
          .finally(() => {
            active--;
            if (active === 0 && idx >= items.length) resolve();
            else next();
          });
      }
      if (items.length === 0) resolve();
    }
    try { next(); } catch (e) { reject(e); }
  });
}

// ── Type for incoming job ────────────────────────────────────────────────────

type JobIn = {
  id: string;
  company_name: string | null;
  company_website: string | null;
  company_industry: string | null;
  company_size: string | null;
  description: string | null;
  job_title: string | null;
  location: string | null;
  country: string | null;
  salary: string | null;
  work_type: string | null;
  work_arrangement: string | null;
  emails: string[];
  phone_numbers: string[];
  recruiter_name: string | null;
  recruiter_agency: string | null;
  recruiter_website: string | null;
  listed_at: string | null;
  [key: string]: unknown;
};

// ══════════════════════════════════════════════════════════════════════════════
// METHOD 1: AI Analysis (OpenAI)
// ══════════════════════════════════════════════════════════════════════════════

async function enrichWithAI(jobs: JobIn[]): Promise<Record<string, Record<string, unknown>>> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  const results: Record<string, Record<string, unknown>> = {};

  await withConcurrency(jobs, async (job) => {
    try {
      const prompt = buildAIPrompt(job);

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 1200,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error(`[ai] OpenAI ${res.status} for ${job.company_name}: ${errBody.slice(0, 200)}`);
        return;
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? "";
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let p: Record<string, unknown>;
      try {
        p = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.error(`[ai] ${job.company_name} — malformed JSON from GPT:`, jsonStr.slice(0, 200));
        return; // skip this job, don't crash the batch
      }

      results[job.id] = mapAIResponse(p);
    } catch (e) {
      console.error(`[ai] ${job.company_name} failed:`, String(e));
    }
  });

  return results;
}

/** Build the deep classification prompt for a single job */
function buildAIPrompt(job: JobIn): string {
  const recruiterInfo = [
    job.recruiter_name ? `RECRUITER NAME: ${job.recruiter_name}` : null,
    job.recruiter_agency ? `RECRUITER AGENCY: ${job.recruiter_agency}` : null,
    job.recruiter_website ? `RECRUITER WEBSITE: ${job.recruiter_website}` : null,
  ].filter(Boolean).join("\n");

  return `You are a recruitment intelligence analyst for a STAFFING AGENCY. We supply candidates to companies. Analyze this job listing so we can pitch our staffing services to the hiring company.

═══ JOB LISTING DATA ═══
JOB TITLE: ${job.job_title || "Unknown"}
COMPANY: ${job.company_name || "Unknown"}
INDUSTRY: ${job.company_industry || "Unknown"}
COMPANY SIZE: ${job.company_size || "Unknown"}
LOCATION: ${job.location || "Unknown"}
COUNTRY: ${job.country || "Unknown"}
SALARY: ${job.salary || "Not specified"}
WORK TYPE: ${job.work_type || "Unknown"}
WORK ARRANGEMENT: ${job.work_arrangement || "Unknown"}
LISTED: ${job.listed_at || "Unknown"}
${recruiterInfo ? recruiterInfo + "\n" : ""}
DESCRIPTION:
${(job.description || "").slice(0, 4000)}

═══ INSTRUCTIONS ═══
Respond with a single JSON object. Every field is required.

{
  "poster_type": "direct_employer" or "agency_recruiter" — Is this posted by the company itself or by a recruitment agency? Look for clues: recruiter name/agency fields, phrases like "on behalf of our client", generic company descriptions, recruitment firm branding.
  "poster_reason": "1 sentence explaining why you classified it as direct_employer or agency_recruiter",

  "company_summary": "1-2 sentence summary of what the hiring company does",
  "hiring_signal": "Why they are hiring — growth, replacement, new team, project-based, seasonal, etc.",
  "relevance_score": <1-10 integer — how good a prospect for a staffing agency. 10 = high volume hirer, direct employer, clear role. 1 = agency post or vague listing>,
  "relevance_reason": "1 sentence explaining the score",
  "suggested_dm_title": "Job title of the decision maker to target (e.g. HR Manager, CEO, Head of Operations)",

  "role_seniority": "Junior / Mid / Senior / Lead / Executive",
  "role_function": "The department or function: Marketing, Engineering, Sales, Operations, Finance, HR, Admin, Healthcare, Construction, etc.",
  "required_skills": ["skill1", "skill2", "skill3"] — top 3-6 skills or technologies from the ad,
  "required_experience": "Experience requirement, e.g. '3-5 years', '10+', 'entry level'",
  "required_certifications": ["cert1", "cert2"] — any licenses, certifications, or qualifications mentioned. Empty array if none,
  "employment_type": "Permanent / Contract / Temp / Temp-to-Perm / Casual",

  "urgency": "Low / Medium / High / Immediate",
  "urgency_clues": "Evidence for urgency level — ASAP mentions, short deadline, repost indicators, immediate start",
  "team_size_clue": "Any hint about team size or department size. Empty string if none",
  "reports_to": "Who this role reports to if mentioned. Empty string if not clear",
  "company_pain_points": "What challenges or needs does the ad reveal? What problem are they solving by hiring?",
  "work_model": "On-site / Hybrid / Remote / Flexible",
  "industry_vertical": "Specific sub-industry, e.g. SaaS, Aged Care, Commercial Construction, Retail Banking",

  "salary_normalized": "Parsed salary range, e.g. '$80k-$100k AUD', '$50/hr'. Use 'Not disclosed' if truly not mentioned",
  "benefits_summary": "Key benefits in 1 sentence (e.g. 'Salary packaging, WFH Fridays, car allowance'). 'None mentioned' if empty",

  "candidate_persona": "1-2 sentence description of the ideal candidate they want — who is this person?",
  "pitch_angle": "1 sentence: how should our staffing agency position itself when reaching out? What value do we offer for THIS specific role?",
  "email_snippet": "2-3 sentence cold email hook personalized to this job ad. Address the decision maker. Mention the specific role and why we can help fill it quickly. Professional but warm tone.",
  "objection_preempt": "The most likely objection from the company and a 1-sentence rebuttal"
}`;
}

/** Map parsed AI response to database column names */
function mapAIResponse(p: Record<string, unknown>): Record<string, unknown> {
  const toArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String).filter(Boolean) : [];

  return {
    // Existing fields (keep column names)
    ai_company_summary:     String(p.company_summary ?? ""),
    ai_hiring_signal:       String(p.hiring_signal ?? ""),
    ai_relevance_score:     Math.min(10, Math.max(1, Number(p.relevance_score) || 5)),
    ai_relevance_reason:    String(p.relevance_reason ?? ""),
    ai_suggested_dm_title:  String(p.suggested_dm_title ?? ""),

    // Recruiter classification
    ai_poster_type:         String(p.poster_type ?? "unknown"),
    ai_poster_reason:       String(p.poster_reason ?? ""),

    // Role classification
    ai_role_seniority:      String(p.role_seniority ?? ""),
    ai_role_function:       String(p.role_function ?? ""),
    ai_required_skills:     toArr(p.required_skills),
    ai_required_experience: String(p.required_experience ?? ""),
    ai_required_certifications: toArr(p.required_certifications),
    ai_employment_type:     String(p.employment_type ?? ""),

    // Hiring intelligence
    ai_urgency:             String(p.urgency ?? ""),
    ai_urgency_clues:       String(p.urgency_clues ?? ""),
    ai_team_size_clue:      String(p.team_size_clue ?? ""),
    ai_reports_to:          String(p.reports_to ?? ""),
    ai_company_pain_points: String(p.company_pain_points ?? ""),
    ai_work_model:          String(p.work_model ?? ""),
    ai_industry_vertical:   String(p.industry_vertical ?? ""),

    // Compensation
    ai_salary_normalized:   String(p.salary_normalized ?? ""),
    ai_benefits_summary:    String(p.benefits_summary ?? ""),

    // Cold email building blocks
    ai_candidate_persona:   String(p.candidate_persona ?? ""),
    ai_pitch_angle:         String(p.pitch_angle ?? ""),
    ai_email_snippet:       String(p.email_snippet ?? ""),
    ai_objection_preempt:   String(p.objection_preempt ?? ""),

    ai_enriched_at:         new Date().toISOString(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// METHOD 2: Apollo DM Finder
// ══════════════════════════════════════════════════════════════════════════════

function extractDomain(url: string): string {
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch { return url; }
}

const DM_TITLES = [
  "owner", "director", "ceo", "co-founder", "founder",
  "principal", "managing director", "president", "partner",
  "head of", "vp", "chief",
];

async function apolloChain(job: JobIn, costCtx?: CostCtx): Promise<Record<string, unknown>> {
  const empty = { dm_name: "", dm_title: "", dm_email: "", dm_phone: "", dm_mobile: "", dm_linkedin_url: "" };

  const domain = job.company_website ? extractDomain(job.company_website) : "";
  if (!domain && !job.company_name) return empty;

  // Step 1: Find the person
  const searchInput: Record<string, unknown> = {
    number_of_pages_to_scrape: 1,
    person_titles: DM_TITLES,
  };
  if (domain)           searchInput.organization_domains = [domain];
  if (job.company_name) searchInput.q_organization_name  = job.company_name;

  const people = await runApifyActor("coladeu/apollo-people-leads-scraper", searchInput, 60, costCtx);
  if (!people.length) return empty;

  const person = people[0] as Record<string, unknown>;
  const personId   = String(person.id ?? person.person_id ?? "");
  const personName = String(person.name ?? person.full_name ?? "");
  const personTitle = String(person.title ?? person.job_title ?? "");
  const linkedinUrl = String(person.linkedin_url ?? person.linkedin ?? "");

  if (!personId) {
    return { ...empty, dm_name: personName, dm_title: personTitle, dm_linkedin_url: linkedinUrl };
  }

  // Step 2: Enrich phone + email
  const enriched = await runApifyActor(
    "coladeu/apollo-person-phone-and-email-enrichment",
    { ids: [personId] },
    45,
    costCtx,
  );

  if (!enriched.length) {
    return { ...empty, dm_name: personName, dm_title: personTitle, dm_linkedin_url: linkedinUrl };
  }

  const contact = enriched[0] as Record<string, unknown>;

  return {
    dm_name:         personName,
    dm_title:        personTitle,
    dm_email:        String(contact.email ?? ""),
    dm_phone:        String(contact.phone_number ?? contact.phone ?? ""),
    dm_mobile:       String(contact.mobile_phone ?? contact.mobile ?? ""),
    dm_linkedin_url: linkedinUrl,
  };
}

async function enrichWithApollo(jobs: JobIn[], costCtx?: CostCtx): Promise<Record<string, Record<string, unknown>>> {
  if (!APIFY_API_KEY) throw new Error("APIFY_API_KEY not configured");

  const results: Record<string, Record<string, unknown>> = {};
  const infraErrors: string[] = [];

  await withConcurrency(jobs, async (job) => {
    try {
      const dm = await apolloChain(job, costCtx);
      results[job.id] = { ...dm, dm_enriched_at: new Date().toISOString() };
    } catch (e) {
      if (e instanceof ApifyInfraError) {
        infraErrors.push(`${job.company_name}: ${e.message}`);
        // Do not add to results — batch will abort below
      } else {
        console.error(`[apollo] ${job.company_name} failed:`, String(e));
      }
    }
  });

  // If ≥ 30% of jobs hit infra errors, abort the whole batch so caller doesn't
  // increment attempts on transient failures.
  if (infraErrors.length >= Math.max(1, Math.ceil(jobs.length * 0.3))) {
    throw new ApifyInfraError(
      `Apollo batch: ${infraErrors.length}/${jobs.length} jobs hit infra errors. First: ${infraErrors[0]}`,
      "apollo-batch",
    );
  }

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// METHOD 3: LinkedIn Company Intel
// ══════════════════════════════════════════════════════════════════════════════

async function enrichWithLinkedIn(jobs: JobIn[], costCtx?: CostCtx): Promise<Record<string, Record<string, unknown>>> {
  if (!APIFY_API_KEY) throw new Error("APIFY_API_KEY not configured");

  const results: Record<string, Record<string, unknown>> = {};

  await withConcurrency(jobs, async (job) => {
    try {
      if (!job.company_name) return;

      const items = await runApifyActor(
        "bebity/linkedin-premium-actor",
        { searchQueries: [job.company_name], maxItems: 1 },
        60,
        costCtx,
      );

      if (!items.length) return;
      const co = items[0] as Record<string, unknown>;

      results[job.id] = {
        li_company_url:  String(co.url ?? co.linkedinUrl ?? ""),
        li_company_desc: String(co.description ?? co.about ?? "").slice(0, 2000),
        li_company_size: String(co.employeeCount ?? co.staffCount ?? co.size ?? ""),
        li_industry:     String(co.industry ?? ""),
        li_hq_location:  String(co.headquarter ?? co.headquarters ?? co.location ?? ""),
        li_enriched_at:  new Date().toISOString(),
      };
    } catch (e) {
      console.error(`[linkedin] ${job.company_name} failed:`, String(e));
    }
  });

  return results;
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Auth: verify Bearer token matches service role key (always required)
  if (!SERVICE_ROLE_KEY) {
    return json({ error: "Server misconfigured — SERVICE_ROLE_KEY not set" }, 500);
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json({ error: "Unauthorized — invalid or missing Authorization header" }, 401);
  }

  let body: { jobs: JobIn[]; method?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { jobs, method = "ai" } = body;
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return json({ error: "jobs array is required and must not be empty" }, 400);
  }
  if (jobs.length > 50) {
    return json({ error: "Maximum 50 jobs per enrichment batch" }, 400);
  }

  try {
    const costCtx: CostCtx = { totalCostUsd: 0 };
    let enrichments: Record<string, Record<string, unknown>> = {};

    switch (method) {
      case "ai":
        enrichments = await enrichWithAI(jobs);
        break;
      case "apollo":
        enrichments = await enrichWithApollo(jobs, costCtx);
        break;
      case "linkedin":
        enrichments = await enrichWithLinkedIn(jobs, costCtx);
        break;
      default:
        return json({ error: `Unknown method: ${method}` }, 400);
    }

    const enrichedCount = Object.keys(enrichments).length;

    return json({ success: true, method, enrichments, enrichedCount, costUsd: costCtx.totalCostUsd });
  } catch (err) {
    if (err instanceof ApifyInfraError) {
      return json({
        error: err.message,
        code: "APIFY_INFRA_ERROR",
        retryable: true,
        actor: err.actor,
      }, 502);
    }
    return json({ error: `Enrichment failed: ${String(err)}` }, 500);
  }
});

// Edge Function: engine-jobs-enrich
// 3-mode enrichment for job leads:
//   method="ai"       — OpenAI analysis (company summary, hiring signal, relevance)
//   method="apollo"   — Apollo 2-step DM finder (email + phone)
//   method="linkedin" — LinkedIn company intel via Apify

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const APIFY_API_KEY  = Deno.env.get("APIFY_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

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

async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutSecs = 60,
): Promise<Record<string, unknown>[]> {
  if (!APIFY_API_KEY) return [];
  const slug = actorId.replaceAll("/", "~");
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${slug}/run-sync-get-dataset-items?timeout=${timeoutSecs}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${APIFY_API_KEY}`,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout((timeoutSecs + 10) * 1000),
      },
    );
    if (!res.ok) { console.error(`[apify] ${slug} → HTTP ${res.status}`); return []; }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) { console.error(`[apify] ${slug} failed:`, String(e)); return []; }
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
          .catch(() => {})
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
  description: string | null;
  job_title: string | null;
  location: string | null;
  country: string | null;
  salary: string | null;
  emails: string[];
  phone_numbers: string[];
  recruiter_name: string | null;
  recruiter_agency: string | null;
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
      const prompt = `You are a B2B sales intelligence analyst. Analyze this job listing to help us pitch our services to the hiring company.

JOB TITLE: ${job.job_title}
COMPANY: ${job.company_name || "Unknown"}
LOCATION: ${job.location || "Unknown"}
SALARY: ${job.salary || "Not specified"}
DESCRIPTION:
${(job.description || "").slice(0, 3000)}

Respond in JSON only (no markdown) with these fields:
{
  "company_summary": "Brief 1-2 sentence summary of what the company does based on clues in the listing",
  "hiring_signal": "Why they are likely hiring — growth, replacement, new department, project-based, etc.",
  "relevance_score": <1-10 integer — how good a prospect is this company for B2B outreach>,
  "relevance_reason": "1 sentence explaining the score",
  "suggested_dm_title": "The job title of the decision maker we should target (e.g. CEO, Head of Marketing, CTO)"
}`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(30_000),
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? "";

      // Parse JSON from response (handle markdown code blocks)
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr);

      results[job.id] = {
        ai_company_summary:    parsed.company_summary || "",
        ai_hiring_signal:      parsed.hiring_signal || "",
        ai_relevance_score:    Math.min(10, Math.max(1, Number(parsed.relevance_score) || 5)),
        ai_relevance_reason:   parsed.relevance_reason || "",
        ai_suggested_dm_title: parsed.suggested_dm_title || "",
        ai_enriched_at:        new Date().toISOString(),
      };
    } catch (e) {
      console.error(`[ai] ${job.company_name} failed:`, String(e));
    }
  });

  return results;
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

async function apolloChain(job: JobIn): Promise<Record<string, unknown>> {
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

  const people = await runApifyActor("coladeu/apollo-people-leads-scraper", searchInput, 60);
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

async function enrichWithApollo(jobs: JobIn[]): Promise<Record<string, Record<string, unknown>>> {
  if (!APIFY_API_KEY) throw new Error("APIFY_API_KEY not configured");

  const results: Record<string, Record<string, unknown>> = {};

  await withConcurrency(jobs, async (job) => {
    try {
      const dm = await apolloChain(job);
      results[job.id] = { ...dm, dm_enriched_at: new Date().toISOString() };
    } catch (e) {
      console.error(`[apollo] ${job.company_name} failed:`, String(e));
    }
  });

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// METHOD 3: LinkedIn Company Intel
// ══════════════════════════════════════════════════════════════════════════════

async function enrichWithLinkedIn(jobs: JobIn[]): Promise<Record<string, Record<string, unknown>>> {
  if (!APIFY_API_KEY) throw new Error("APIFY_API_KEY not configured");

  const results: Record<string, Record<string, unknown>> = {};

  await withConcurrency(jobs, async (job) => {
    try {
      if (!job.company_name) return;

      const items = await runApifyActor(
        "bebity/linkedin-premium-actor",
        { searchQueries: [job.company_name], maxItems: 1 },
        60,
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
    let enrichments: Record<string, Record<string, unknown>> = {};

    switch (method) {
      case "ai":
        enrichments = await enrichWithAI(jobs);
        break;
      case "apollo":
        enrichments = await enrichWithApollo(jobs);
        break;
      case "linkedin":
        enrichments = await enrichWithLinkedIn(jobs);
        break;
      default:
        return json({ error: `Unknown method: ${method}` }, 400);
    }

    const enrichedCount = Object.keys(enrichments).length;

    return json({ success: true, method, enrichments, enrichedCount });
  } catch (err) {
    return json({ error: `Enrichment failed: ${String(err)}` }, 500);
  }
});

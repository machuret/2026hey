// Edge Function: engine-leads-enrich
// Enriches a batch of leads using Apify enrichment actors
// Chains: decision-maker extractor → phone/social scraper

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const APIFY_API_KEY    = Deno.env.get("APIFY_API_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function verifyAuth(req: Request): boolean {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  return token === SERVICE_ROLE_KEY || token === ANON_KEY;
}

type LeadIn = {
  name: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  source: string;
  raw?: Record<string, unknown>;
};

type LeadOut = LeadIn & {
  enriched_email?: string;
  enriched_phone?: string;
  decision_maker?: string;
  enriched_at: string;
};

/** Run an Apify actor synchronously and return dataset items */
async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutMs = 60000,
): Promise<Record<string, unknown>[]> {
  if (!APIFY_API_KEY) return [];

  const actorSlug = actorId.replace("/", "~");
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorSlug}/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=${Math.floor(timeoutMs / 1000)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(timeoutMs + 5000),
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Extract domain from a URL */
function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!verifyAuth(req)) return json({ error: "Unauthorized" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!APIFY_API_KEY) return json({ error: "APIFY_API_KEY not configured" }, 500);

  let body: { leads: LeadIn[]; actors?: string[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { leads, actors = ["decision-maker", "snacci"] } = body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return json({ error: "leads array is required and must not be empty" }, 400);
  }
  if (leads.length > 50) {
    return json({ error: "Maximum 50 leads per enrichment batch" }, 400);
  }

  const enriched: LeadOut[] = leads.map((l) => ({ ...l, enriched_at: new Date().toISOString() }));

  const CONCURRENCY = 5;

  /** Run a batch of async tasks with a max concurrency limit */
  async function withConcurrency<T>(
    items: T[],
    fn: (item: T) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += CONCURRENCY) {
      await Promise.allSettled(items.slice(i, i + CONCURRENCY).map(fn));
    }
  }

  // ── Actor 1: Decision-maker name + email extractor ───────────────
  if (actors.includes("decision-maker")) {
    const websiteLeads = enriched.filter((l) => l.website && !l.email);
    await withConcurrency(websiteLeads, async (lead) => {
      try {
        const items = await runApifyActor(
          "dominic-quaiser/decision-maker-name-email-extractor",
          { startUrls: [{ url: lead.website }], maxPagesToProcess: 3 },
          45000,
        );
        if (items.length > 0) {
          const item = items[0] as Record<string, unknown>;
          if (item.email && !lead.email) lead.enriched_email = String(item.email);
          if (item.name  && !lead.decision_maker) lead.decision_maker = String(item.name);
        }
      } catch { /* non-fatal per-lead failure */ }
    });
  }

  // ── Actor 2: Snacci — phones + socials from website ──────────────
  if (actors.includes("snacci")) {
    const phoneLeads = enriched.filter((l) => l.website && !l.phone);
    await withConcurrency(phoneLeads, async (lead) => {
      try {
        const domain = extractDomain(lead.website);
        const items = await runApifyActor(
          "peterasorensen/snacci",
          { queries: [domain] },
          30000,
        );
        if (items.length > 0) {
          const item = items[0] as Record<string, unknown>;
          const phone = item.phone ?? item.phoneNumber ??
            (Array.isArray(item.phones) ? item.phones[0] : undefined);
          if (phone && !lead.phone) lead.enriched_phone = String(phone);
        }
      } catch { /* non-fatal */ }
    });
  }

  // Merge enriched fields back into base fields
  const finalLeads: LeadOut[] = enriched.map((l) => ({
    ...l,
    email: l.email || l.enriched_email || "",
    phone: l.phone || l.enriched_phone || "",
  }));

  const enrichedCount = finalLeads.filter(
    (l) => l.enriched_email || l.enriched_phone || l.decision_maker
  ).length;

  return json({ success: true, leads: finalLeads, enrichedCount });
});

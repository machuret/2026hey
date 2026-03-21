// Edge Function: engine-leads-scrape
// Calls Apify to scrape leads based on user-supplied actor + input

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const APIFY_API_KEY    = Deno.env.get("APIFY_API_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function verifyAuth(req: Request): boolean {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  return token === SERVICE_ROLE_KEY || token === ANON_KEY;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ok = verifyAuth(req);
  if (!ok) return json({ error: "Unauthorized" }, 401);

  if (!APIFY_API_KEY) return json({ error: "APIFY_API_KEY not configured" }, 500);

  const body = await req.json();
  // actor: Apify actor ID, e.g. "apify/google-maps-scraper"
  // input: actor-specific input object
  // maxItems: cap results (default 50)
  const { actor = "compass/crawler-google-places", input = {}, maxItems = 50 } = body;
  const actorSlug = actor.replace("/", "~");

  try {
    // 1. Start the Apify actor run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${actorSlug}/runs?token=${APIFY_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!startRes.ok) {
      const err = await startRes.text();
      return json({ error: `Apify start failed: ${err.slice(0, 300)}` }, 502);
    }

    const { data: run } = await startRes.json();
    const runId = run?.id;
    if (!runId) return json({ error: "No run ID returned from Apify" }, 502);

    // 2. Poll until finished (max 90s)
    const pollStart = Date.now();
    let status = "RUNNING";
    while (status === "RUNNING" || status === "READY") {
      if (Date.now() - pollStart > 90000) return json({ error: "Apify run timed out (90s)" }, 504);
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const { data: runData } = await statusRes.json();
      status = runData?.status ?? "FAILED";
    }

    if (status !== "SUCCEEDED") return json({ error: `Apify run ended with status: ${status}` }, 502);

    // 3. Fetch dataset items
    const datasetRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_KEY}&limit=${maxItems}&clean=true`,
      { signal: AbortSignal.timeout(15000) }
    );
    const items = await datasetRes.json();

    // 4. Normalise to our lead shape
    const leads = (Array.isArray(items) ? items : []).map((item: Record<string, unknown>) => ({
      name:     (item.title ?? item.name ?? item.fullName ?? item.company ?? "") as string,
      company:  (item.title ?? item.company ?? "") as string,
      phone:    (item.phone ?? item.phoneNumber ?? (Array.isArray(item.phones) ? item.phones[0] : "") ?? "") as string,
      email:    (item.email ?? (Array.isArray(item.emails) ? item.emails[0] : "") ?? "") as string,
      website:  (item.website ?? item.url ?? "") as string,
      industry: (item.categoryName ?? item.industry ?? item.category ?? "") as string,
      source:   "scraper" as const,
      raw:      item,
    }));

    return json({ success: true, count: leads.length, leads });
  } catch (err) {
    return json({ error: `Scrape failed: ${String(err)}` }, 500);
  }
});

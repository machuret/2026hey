// Edge Function: engine-leads-enrich
// Enriches leads by crawling their website directly to extract emails + phones
// Fast, free — no external API needed. Falls back gracefully if site is unreachable.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
  enriched_at: string;
};

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?61|0)[\s\-]?[2-9]\d{2}[\s\-]?\d{3}[\s\-]?\d{3,4}|(?:\+?1[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g;

const JUNK_EMAILS = new Set([
  "example@", "info@example", "test@", "noreply@", "no-reply@",
  "sentry@", "w3schools", "schema.org", "example.com",
]);

function isJunkEmail(e: string): boolean {
  const low = e.toLowerCase();
  return JUNK_EMAILS.has(low) || JUNK_EMAILS.has(low.split("@")[1] ?? "") ||
    Array.from(JUNK_EMAILS).some((j) => low.includes(j));
}

function normaliseUrl(url: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

/** Crawl up to 3 pages of a site and extract emails/phones */
async function crawlSite(rawUrl: string): Promise<{ email: string; phone: string }> {
  const base = normaliseUrl(rawUrl);
  if (!base) return { email: "", phone: "" };

  // Pages to try in order: homepage, /contact, /about
  const paths = ["", "/contact", "/contact-us", "/about"];
  const emails = new Set<string>();
  const phones = new Set<string>();

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadEnricher/1.0)" },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Extract emails
      const found = html.match(EMAIL_RE) ?? [];
      found.forEach((e) => { if (!isJunkEmail(e)) emails.add(e.toLowerCase()); });

      // Extract phones from mailto: and text
      const mailtoRe = /mailto:([^"'?]+)/g;
      let m: RegExpExecArray | null;
      while ((m = mailtoRe.exec(html)) !== null) {
        const e = m[1].trim().toLowerCase();
        if (e.includes("@") && !isJunkEmail(e)) emails.add(e);
      }

      const phoneMatches = html.match(PHONE_RE) ?? [];
      phoneMatches.forEach((p) => phones.add(p.replace(/\s/g, "")));

      // Stop early if we found something
      if (emails.size > 0) break;
    } catch { /* unreachable or timeout — try next path */ }
  }

  return {
    email: Array.from(emails)[0] ?? "",
    phone: Array.from(phones)[0] ?? "",
  };
}

const CONCURRENCY = 5;

async function withConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.allSettled(items.slice(i, i + CONCURRENCY).map(fn));
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { leads: LeadIn[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { leads } = body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return json({ error: "leads array is required and must not be empty" }, 400);
  }
  if (leads.length > 100) {
    return json({ error: "Maximum 100 leads per enrichment batch" }, 400);
  }

  const enriched: LeadOut[] = leads.map((l) => ({ ...l, enriched_at: new Date().toISOString() }));

  // Only crawl leads that have a website but are missing email/phone
  const needsEnrich = enriched.filter((l) => l.website && (!l.email || !l.phone));

  await withConcurrency(needsEnrich, async (lead) => {
    try {
      const { email, phone } = await crawlSite(lead.website);
      if (email && !lead.email) lead.enriched_email = email;
      if (phone && !lead.phone) lead.enriched_phone = phone;
    } catch { /* non-fatal */ }
  });

  // Merge enriched fields into base fields
  const finalLeads: LeadOut[] = enriched.map((l) => ({
    ...l,
    email: l.email || l.enriched_email || "",
    phone: l.phone || l.enriched_phone || "",
  }));

  const enrichedCount = finalLeads.filter(
    (l) => l.enriched_email || l.enriched_phone,
  ).length;

  return json({ success: true, leads: finalLeads, enrichedCount });
});

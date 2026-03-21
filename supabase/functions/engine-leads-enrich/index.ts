// Edge Function: engine-leads-enrich
// Two enrichment modes:
//   method="crawl"  (default) — crawl website HTML for emails/phones/DM
//   method="apollo" — 2-step Apify chain: find person by domain → enrich for email+phone

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY") ?? "";

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
  enriched_mobile?: string;
  mobile?: string;
  decision_maker?: string;
  enriched_at: string;
};

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Australian mobile: 04xx xxx xxx  | intl: +614x xxx xxx
const MOBILE_RE = /(?:\+?61\s?4|04)\d{2}[\s\-]?\d{3}[\s\-]?\d{3}/g;
// General phone (landline or any)
const PHONE_RE  = /(?:\+?61|0)[\s\-]?[2-9]\d{2}[\s\-]?\d{3}[\s\-]?\d{3,4}/g;

// Decision-maker title keywords
const DM_TITLES = ["owner", "director", "ceo", "founder", "principal", "manager", "partner", "president", "head of"];

const JUNK_EMAILS = [
  "example", "noreply", "no-reply", "sentry", "w3schools", "schema.org",
  "example.com", "test@", "user@", "email@", "your@",
];

function isJunkEmail(e: string): boolean {
  const low = e.toLowerCase();
  return JUNK_EMAILS.some((j) => low.includes(j));
}

function normaliseUrl(url: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

/** Try to extract a decision maker name from HTML using title keywords */
function extractDecisionMaker(html: string): string {
  // Look for patterns like: "John Smith, Owner" or "Owner: John Smith" or "Director - Jane Doe"
  const lower = html.toLowerCase();
  for (const title of DM_TITLES) {
    // Pattern: Name followed by title (within 60 chars)
    const afterIdx = lower.indexOf(title);
    if (afterIdx === -1) continue;

    // Grab surrounding text (300 chars either side)
    const chunk = html.slice(Math.max(0, afterIdx - 150), afterIdx + 150);

    // Look for a capitalised name nearby (2 words, each 2-20 chars, capitalised)
    const nameRe = /\b([A-Z][a-z]{1,19})\s+([A-Z][a-z]{1,19})\b/g;
    let m: RegExpExecArray | null;
    while ((m = nameRe.exec(chunk)) !== null) {
      const name = `${m[1]} ${m[2]}`;
      // Skip obvious non-names
      if (["Contact Us", "Our Team", "About Us", "Head Of", "Read More", "Learn More"].includes(name)) continue;
      return name;
    }
  }
  return "";
}

/** Crawl homepage + /contact + /about and extract email, phone, mobile, decision maker */
async function crawlSite(rawUrl: string): Promise<{
  email: string; phone: string; mobile: string; decision_maker: string;
}> {
  const base = normaliseUrl(rawUrl);
  if (!base) return { email: "", phone: "", mobile: "", decision_maker: "" };

  const paths = ["", "/contact", "/contact-us", "/about", "/about-us", "/team"];
  const emails  = new Set<string>();
  const phones  = new Set<string>();
  const mobiles = new Set<string>();
  let dm = "";

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadEnricher/1.0)" },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Emails — prefer mailto: links (more reliable than raw text)
      const mailtoRe = /mailto:([^"'?\s>]+)/g;
      let m: RegExpExecArray | null;
      while ((m = mailtoRe.exec(html)) !== null) {
        const e = decodeURIComponent(m[1]).trim().toLowerCase();
        if (e.includes("@") && !isJunkEmail(e)) emails.add(e);
      }
      // Fallback: raw email regex
      if (emails.size === 0) {
        (html.match(EMAIL_RE) ?? []).forEach((e) => {
          if (!isJunkEmail(e)) emails.add(e.toLowerCase());
        });
      }

      // Mobiles
      (html.match(MOBILE_RE) ?? []).forEach((p) => mobiles.add(p.replace(/[\s\-]/g, "")));

      // Landlines (only if no mobile found yet)
      if (mobiles.size === 0) {
        (html.match(PHONE_RE) ?? []).forEach((p) => phones.add(p.replace(/[\s\-]/g, "")));
      }

      // Decision maker — best found on about/team pages
      if (!dm && (path.includes("about") || path.includes("team") || path === "")) {
        dm = extractDecisionMaker(html);
      }

      // Stop crawling pages once we have email + phone/mobile
      if (emails.size > 0 && (mobiles.size > 0 || phones.size > 0)) break;
    } catch { /* unreachable or timeout — try next path */ }
  }

  return {
    email:          Array.from(emails)[0]  ?? "",
    mobile:         Array.from(mobiles)[0] ?? "",
    phone:          Array.from(phones)[0]  ?? "",
    decision_maker: dm,
  };
}

const CONCURRENCY = 3;

async function withConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.allSettled(items.slice(i, i + CONCURRENCY).map(fn));
  }
}

/** Run an Apify actor synchronously and return dataset items */
async function runApifyActor(
  actorSlug: string,
  input: Record<string, unknown>,
  timeoutSecs = 60,
): Promise<Record<string, unknown>[]> {
  if (!APIFY_API_KEY) return [];
  const slug = actorSlug.replace("/", "~");
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${slug}/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=${timeoutSecs}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout((timeoutSecs + 10) * 1000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

/** Extract domain from a website URL */
function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch { return url; }
}

/**
 * Apollo 2-step chain:
 * 1. Search for decision maker by domain/company → get Apollo person ID + name + title
 * 2. Enrich that person ID → get email + phone
 */
async function apolloChain(lead: LeadIn): Promise<{
  decision_maker: string;
  dm_title: string;
  email: string;
  phone: string;
  mobile: string;
}> {
  const empty = { decision_maker: "", dm_title: "", email: "", phone: "", mobile: "" };

  const domain = lead.website ? extractDomain(lead.website) : "";
  if (!domain && !lead.company) return empty;

  // ── Step 1: Find the person ───────────────────────────────────────
  const DM_TITLES = ["owner", "director", "ceo", "co-founder", "founder", "principal", "managing director", "president", "partner"];

  const searchInput: Record<string, unknown> = {
    number_of_pages_to_scrape: 1,
    person_titles: DM_TITLES,
  };
  if (domain)       searchInput.organization_domains = [domain];
  if (lead.company) searchInput.q_organization_name  = lead.company;

  const people = await runApifyActor("coladeu/apollo-people-leads-scraper", searchInput, 60);
  if (!people.length) return empty;

  const person = people[0] as Record<string, unknown>;
  const personId   = String(person.id   ?? person.person_id ?? "");
  const personName = String(person.name ?? person.full_name ?? "");
  const personTitle = String(person.title ?? person.job_title ?? "");

  if (!personId) {
    return { ...empty, decision_maker: personName, dm_title: personTitle };
  }

  // ── Step 2: Enrich phone + email ──────────────────────────────────
  const enriched = await runApifyActor(
    "coladeu/apollo-person-phone-and-email-enrichment",
    { ids: [personId] },
    45,
  );

  if (!enriched.length) {
    return { ...empty, decision_maker: personName, dm_title: personTitle };
  }

  const contact = enriched[0] as Record<string, unknown>;
  const email  = String(contact.email         ?? "");
  const phone  = String(contact.phone_number  ?? contact.phone ?? "");
  const mobile = String(contact.mobile_phone  ?? contact.mobile ?? "");

  return { decision_maker: personName, dm_title: personTitle, email, phone, mobile };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { leads: LeadIn[]; method?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { leads, method = "crawl" } = body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return json({ error: "leads array is required and must not be empty" }, 400);
  }
  if (leads.length > 100) {
    return json({ error: "Maximum 100 leads per enrichment batch" }, 400);
  }

  const enriched: LeadOut[] = leads.map((l) => ({ ...l, enriched_at: new Date().toISOString() }));

  if (method === "apollo") {
    // ── Apollo mode: 2-step decision maker + contact enrichment ──────
    if (!APIFY_API_KEY) return json({ error: "APIFY_API_KEY not configured" }, 500);

    const needsDM = enriched.filter((l) => !l.decision_maker);

    await withConcurrency(needsDM, async (lead) => {
      try {
        const result = await apolloChain(lead);
        if (result.decision_maker) lead.decision_maker = result.decision_maker;
        if (result.email && !lead.email)   lead.enriched_email  = result.email;
        if (result.phone && !lead.phone)   lead.enriched_phone  = result.phone;
        if (result.mobile)                 lead.enriched_mobile = result.mobile;
      } catch { /* non-fatal */ }
    });
  } else {
    // ── Crawl mode (default): scrape website HTML ─────────────────
    const needsEnrich = enriched.filter((l) => l.website && (!l.email || !l.phone));

    await withConcurrency(needsEnrich, async (lead) => {
      try {
        const { email, phone, mobile, decision_maker } = await crawlSite(lead.website);
        if (email          && !lead.email)          lead.enriched_email  = email;
        if (phone          && !lead.phone)          lead.enriched_phone  = phone;
        if (mobile)                                 lead.enriched_mobile = mobile;
        if (decision_maker && !lead.decision_maker) lead.decision_maker  = decision_maker;
      } catch { /* non-fatal */ }
    });
  }

  // Merge enriched fields into base fields
  const finalLeads: LeadOut[] = enriched.map((l) => ({
    ...l,
    email:  l.email  || l.enriched_email  || "",
    phone:  l.phone  || l.enriched_phone  || "",
    mobile: l.enriched_mobile || "",
  }));

  const enrichedCount = finalLeads.filter(
    (l) => l.enriched_email || l.enriched_phone || l.enriched_mobile || l.decision_maker,
  ).length;

  return json({ success: true, leads: finalLeads, enrichedCount });
});

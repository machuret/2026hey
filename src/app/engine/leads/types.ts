// Shared types and constants for the engine leads pipeline

export type ScrapedLead = {
  name: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  source: string;
  enriched_email?: string;
  enriched_phone?: string;
  decision_maker?: string;
  enriched_at?: string;
  ai_score?: number;
  ai_score_reason?: string;
  ai_signals?: string[];
  call_opener?: string;
  raw?: Record<string, unknown>;
};

export type ActorCategory = "scrape" | "enrich" | "intel";

export type ActorDef = {
  id: string;
  label: string;
  category: ActorCategory;
  description: string;
  costPer1k: string;
  inputFields: ("query" | "location" | "url" | "domain" | "industry" | "jobTitle")[];
};

export type HealthStatus = "checking" | "ok" | "error";

export type ApiHealth = {
  crm:   { status: HealthStatus; detail: string };
  apify: { status: HealthStatus; detail: string };
};

export type PipelineTab = "scrape" | "enrich" | "qualify" | "import";

export const ACTORS: ActorDef[] = [
  {
    id: "apify/google-maps-scraper",
    label: "Google Maps Scraper",
    category: "scrape",
    description: "Business name, phone, website, category, address from Google Maps.",
    costPer1k: "~$1–3",
    inputFields: ["query", "location"],
  },
  {
    id: "apify/yellow-pages-scraper",
    label: "Yellow Pages Scraper",
    category: "scrape",
    description: "Name, phone, address, category from Yellow Pages.",
    costPer1k: "~$1",
    inputFields: ["query", "location"],
  },
  {
    id: "code_crafter/leads-finder",
    label: "Leads Finder (Apollo Alt)",
    category: "scrape",
    description: "B2B contacts by title, industry & location with emails included. Apollo alternative.",
    costPer1k: "$1.50",
    inputFields: ["jobTitle", "industry", "location"],
  },
  {
    id: "apify/linkedin-company-scraper",
    label: "LinkedIn Company Scraper",
    category: "scrape",
    description: "Company size, industry, HQ, description from LinkedIn.",
    costPer1k: "~$3",
    inputFields: ["query", "location"],
  },
  {
    id: "dominic-quaiser/decision-maker-name-email-extractor",
    label: "Decision Maker Extractor",
    category: "enrich",
    description: "Crawls a website to extract decision-maker names, titles, and emails.",
    costPer1k: "~$2–5",
    inputFields: ["url"],
  },
  {
    id: "peterasorensen/snacci",
    label: "Phone & Social Scraper",
    category: "enrich",
    description: "Extracts phone numbers and social profiles from websites.",
    costPer1k: "~$1",
    inputFields: ["url"],
  },
  {
    id: "canadesk/hunter-io",
    label: "Hunter.io Email Finder",
    category: "enrich",
    description: "Email lookup by name + domain using Hunter.io.",
    costPer1k: "varies",
    inputFields: ["domain"],
  },
  {
    id: "coladeu/apollo-person-email-enrichment",
    label: "Apollo Email Enrichment",
    category: "enrich",
    description: "Retrieves phone + email for contacts via Apollo.io.",
    costPer1k: "~$2",
    inputFields: ["url"],
  },
  {
    id: "apify/website-content-crawler",
    label: "Website Content Crawler",
    category: "intel",
    description: "Full page content extraction for AI company research and analysis.",
    costPer1k: "~$2",
    inputFields: ["url"],
  },
];

export const CATEGORY_META: Record<ActorCategory, { label: string; colour: string }> = {
  scrape: { label: "Scrape", colour: "bg-indigo-900/30 text-indigo-300 border-indigo-800/50" },
  enrich: { label: "Enrich", colour: "bg-emerald-900/30 text-emerald-300 border-emerald-800/50" },
  intel:  { label: "Intel",  colour: "bg-amber-900/30 text-amber-300 border-amber-800/50" },
};

export const scoreColour = (s: number) =>
  s >= 8 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";

/** Build actor-specific Apify input from form state */
export function buildActorInput(
  actorId: string,
  { query, location, jobTitle, industry, urlInput, maxItems }: {
    query: string; location: string; jobTitle: string;
    industry: string; urlInput: string; maxItems: number;
  },
): Record<string, unknown> {
  switch (actorId) {
    case "apify/google-maps-scraper":
      return { searchStringsArray: [query], locationQuery: location || undefined, maxCrawledPlacesPerSearch: maxItems };
    case "apify/yellow-pages-scraper":
      return { search: query, location: location || undefined, maxItems };
    case "code_crafter/leads-finder":
      return { jobTitles: [jobTitle], industries: industry ? [industry] : undefined, locations: location ? [location] : undefined, maxLeads: maxItems };
    case "apify/linkedin-company-scraper":
      return { searchQueries: [query], location: location || undefined, maxItems };
    case "dominic-quaiser/decision-maker-name-email-extractor":
    case "peterasorensen/snacci":
    case "coladeu/apollo-person-email-enrichment":
    case "apify/website-content-crawler":
      return { startUrls: [{ url: urlInput }], maxCrawledPages: maxItems };
    case "canadesk/hunter-io":
      return { domain: urlInput, maxItems };
    default:
      return { startUrls: [{ url: query || urlInput }], maxCrawledPages: maxItems };
  }
}

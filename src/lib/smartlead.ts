// ═══════════════════════════════════════════════════════════════════════════
// SmartLead helpers — pure functions only (no network, no env).
// Imported by the /api/engine/smartlead Next route AND unit tests.
// The edge function `supabase/functions/smartleads/index.ts` duplicates the
// `LeadIn` shape because Deno/Edge cannot import from this file.
// ═══════════════════════════════════════════════════════════════════════════

/** SmartLead API caps a single add_leads call at 100 leads. */
export const SMARTLEAD_BATCH_SIZE = 100;

/** Timeouts (ms) — named so they're easy to tune. */
export const SMARTLEAD_TIMEOUT_PING_MS   = 15_000;
export const SMARTLEAD_TIMEOUT_ADD_MS    = 90_000;
export const SMARTLEAD_TIMEOUT_TOTAL_MS  = 285_000;

/** Statuses eligible for push. A CRM-pushed lead can ALSO be sent to SmartLead
 *  (different channels), matching the `pushed → smartleaded` transition in
 *  `pipelineStage.ts`. */
export const SMARTLEAD_PUSHABLE_STATUSES = [
  "ai_enriched",
  "dm_enriched",
  "fully_enriched",
  "pushed_to_crm",
] as const;

// ── Minimal job shape the mapper reads. Keep in sync with JobLead. ──────────

export interface SmartLeadJobRow {
  id: string;
  source: string;
  source_id: string;
  job_title: string | null;
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
  emails: string[] | null;
  phone_numbers: string[] | null;
  recruiter_name: string | null;
  recruiter_phone: string | null;
  dm_name: string | null;
  dm_title: string | null;
  dm_email: string | null;
  dm_phone: string | null;
  dm_mobile: string | null;
  dm_linkedin_url: string | null;
  ai_company_summary: string | null;
  ai_pitch_angle: string | null;
  ai_email_snippet: string | null;
  ai_hiring_signal: string | null;
  ai_relevance_score: number | null;
  ai_candidate_persona: string | null;
  li_company_url: string | null;
  li_industry: string | null;
}

/** SmartLead `lead_list[i]` shape. Extra keys are ignored by the API. */
export interface SmartLeadLead {
  first_name:       string | null;
  last_name:        string | null;
  email:            string;
  phone_number:     string | null;
  company_name:     string | null;
  website:          string | null;
  location:         string | null;
  linkedin_profile: string | null;
  company_url:      string | null;
  custom_fields:    Record<string, string | number>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** RFC5321-lite sanity check. SmartLead will re-validate server-side. */
export function isValidEmail(s: string | null | undefined): s is string {
  if (!s) return false;
  const e = s.trim();
  // Must contain @, dot after @, no spaces, length sane.
  return e.length >= 3 && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Split "Mary Jane Smith" → {first: "Mary", last: "Jane Smith"}.
 *  Strips common salutations (Dr., Mr., Ms., Mrs., Mx.) from the start. */
export function splitName(full: string | null | undefined): {
  first: string | null;
  last:  string | null;
} {
  if (!full) return { first: null, last: null };
  const cleaned = full
    .trim()
    .replace(/^(dr|mr|ms|mrs|mx|prof)\.?\s+/i, "")
    .trim();
  if (!cleaned) return { first: null, last: null };
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/** Best-contact email selection: prefer DM, then any valid listing email. */
export function bestEmail(j: Pick<SmartLeadJobRow, "dm_email" | "emails">): string | null {
  if (isValidEmail(j.dm_email)) return j.dm_email!.trim();
  const fromList = (j.emails ?? []).find(isValidEmail);
  return fromList?.trim() ?? null;
}

/** Best phone: DM mobile > DM phone > recruiter > any listing phone. */
export function bestPhone(j: Pick<SmartLeadJobRow, "dm_mobile" | "dm_phone" | "recruiter_phone" | "phone_numbers">): string | null {
  return j.dm_mobile
    || j.dm_phone
    || j.recruiter_phone
    || (j.phone_numbers?.length ? j.phone_numbers[0] : null);
}

/** Chunk an array into groups of `size`. */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be > 0");
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Map a job row → SmartLead lead. Returns null if the job lacks a valid email. */
export function jobToSmartLead(j: SmartLeadJobRow): SmartLeadLead | null {
  const email = bestEmail(j);
  if (!email) return null;

  const { first, last } = splitName(j.dm_name ?? j.recruiter_name);
  const phone  = bestPhone(j);
  const site   = j.company_website || j.li_company_url;

  // Build custom_fields — only non-empty values survive, keeps SmartLead UI tidy.
  const cf: Record<string, string | number> = {};
  const put = (k: string, v: string | number | null | undefined) => {
    if (v === null || v === undefined) return;
    if (typeof v === "string" && !v.trim()) return;
    cf[k] = v;
  };

  put("job_title",        j.job_title);
  put("job_url",          j.job_url);
  put("source",           j.source);
  put("dm_title",         j.dm_title);
  put("salary",           j.salary);
  put("work_type",        j.work_type);
  put("work_arrangement", j.work_arrangement);
  put("company_industry", j.company_industry || j.li_industry);
  put("company_size",     j.company_size);
  put("company_summary",  j.ai_company_summary);
  put("pitch_angle",      j.ai_pitch_angle);
  put("email_snippet",    j.ai_email_snippet);
  put("hiring_signal",    j.ai_hiring_signal);
  put("candidate_persona", j.ai_candidate_persona);
  put("country",          j.country);
  if (j.ai_relevance_score != null) cf.relevance_score = j.ai_relevance_score;

  return {
    first_name:       first,
    last_name:        last,
    email,
    phone_number:     phone,
    company_name:     j.company_name,
    website:          site,
    location:         j.location,
    linkedin_profile: j.dm_linkedin_url,
    company_url:      site,
    custom_fields:    cf,
  };
}

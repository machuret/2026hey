import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin, edgeFnUrl } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 290;

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY          = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Call the smartleads edge fn with the given body. */
async function callSmartLead(body: Record<string, unknown>, timeoutMs = 60_000) {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL not configured");
  const url = edgeFnUrl("smartleads");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY || ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const ct = res.headers.get("content-type") ?? "";
  const data: unknown = ct.includes("application/json")
    ? await res.json()
    : { error: `[smartleads] HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
  return { status: res.status, data };
}

// ── GET ────────────────────────────────────────────────────────────────────
// /api/engine/smartlead?action=ping      → validates API key
// /api/engine/smartlead?action=campaigns → list SmartLead campaigns
export async function GET(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  const action = req.nextUrl.searchParams.get("action") ?? "ping";
  if (action !== "ping" && action !== "campaigns") {
    return NextResponse.json({ error: "action must be 'ping' or 'campaigns'" }, { status: 400 });
  }

  try {
    const { status, data } = await callSmartLead({
      action: action === "campaigns" ? "list_campaigns" : "ping",
    });
    return NextResponse.json(data, { status });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 502 });
  }
}

// ── Lead mapping ───────────────────────────────────────────────────────────

interface JobRow {
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
  [key: string]: unknown;
}

/** Split "John Smith" into { first, last }. Falls back to whole name in first. */
function splitName(full: string | null): { first: string | null; last: string | null } {
  if (!full) return { first: null, last: null };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function bestEmail(j: JobRow): string | null {
  if (j.dm_email && j.dm_email.includes("@")) return j.dm_email;
  const fromList = (j.emails ?? []).find((e) => e && e.includes("@"));
  return fromList ?? null;
}

function jobToSmartLead(j: JobRow): Record<string, unknown> | null {
  const email = bestEmail(j);
  if (!email) return null;

  const { first, last } = splitName(j.dm_name ?? j.recruiter_name);
  const phone = j.dm_mobile || j.dm_phone || j.recruiter_phone
    || (j.phone_numbers?.length ? j.phone_numbers[0] : null);

  return {
    first_name:       first,
    last_name:        last,
    email,
    phone_number:     phone,
    company_name:     j.company_name,
    website:          j.company_website || j.li_company_url,
    location:         j.location,
    linkedin_profile: j.dm_linkedin_url,
    company_url:      j.company_website || j.li_company_url,
    custom_fields: {
      job_title:        j.job_title ?? "",
      job_url:          j.job_url ?? "",
      source:           j.source,
      dm_title:         j.dm_title ?? "",
      salary:           j.salary ?? "",
      work_type:        j.work_type ?? "",
      work_arrangement: j.work_arrangement ?? "",
      company_industry: j.company_industry || j.li_industry || "",
      company_size:     j.company_size ?? "",
      company_summary:  j.ai_company_summary ?? "",
      pitch_angle:      j.ai_pitch_angle ?? "",
      email_snippet:    j.ai_email_snippet ?? "",
      hiring_signal:    j.ai_hiring_signal ?? "",
      candidate_persona: j.ai_candidate_persona ?? "",
      relevance_score:  j.ai_relevance_score ?? 0,
    },
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── POST ───────────────────────────────────────────────────────────────────
// /api/engine/smartlead  body: { jobIds: string[], campaignId: string | number, campaignName?: string }
export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => ({}));
    const { jobIds, campaignId, campaignName } = body as {
      jobIds?: string[];
      campaignId?: string | number;
      campaignName?: string;
    };

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds array is required" }, { status: 400 });
    }
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    const db = getEngineAdmin();

    // Only pushable statuses (must be enriched)
    const PUSHABLE_STATUSES = ["ai_enriched", "dm_enriched", "fully_enriched"];
    const { data: jobs, error: fetchErr } = await db
      .from("job_leads")
      .select("*")
      .in("id", jobIds)
      .in("status", PUSHABLE_STATUSES);

    if (fetchErr) throw fetchErr;
    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { error: "No eligible jobs found (must be enriched and not already pushed)" },
        { status: 404 },
      );
    }

    // Partition: has email vs missing email
    const mapped = (jobs as JobRow[]).map((j) => ({ job: j, lead: jobToSmartLead(j) }));
    const withLead    = mapped.filter((m) => m.lead !== null);
    const missingEmail = mapped.filter((m) => m.lead === null).map((m) => m.job.id);

    if (withLead.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No selected jobs have an email address — enrich them first",
        skipped_no_email: missingEmail.length,
      }, { status: 400 });
    }

    // Batch up to 100 per SmartLead call
    const batches = chunk(withLead, 100);

    let uploaded   = 0;
    let duplicates = 0;
    let invalid    = 0;
    const errors: string[] = [];
    const pushedJobIds: string[] = [];

    for (const batch of batches) {
      const { status, data } = await callSmartLead({
        action: "add_leads",
        campaign_id: campaignId,
        leads: batch.map((m) => m.lead),
      }, 90_000);

      const d = data as Record<string, unknown>;
      if (status >= 200 && status < 300 && d.success) {
        uploaded   += Number(d.uploaded   ?? 0);
        duplicates += Number(d.duplicates ?? 0);
        invalid    += Number(d.invalid    ?? 0);
        pushedJobIds.push(...batch.map((m) => m.job.id));
      } else {
        errors.push(`Batch of ${batch.length}: ${JSON.stringify(d.error ?? d).slice(0, 200)}`);
      }
    }

    // Mark successfully-pushed jobs in DB
    if (pushedJobIds.length > 0) {
      await db
        .from("job_leads")
        .update({
          status: "pushed_to_smartlead",
          smartlead_campaign_id:   String(campaignId),
          smartlead_campaign_name: campaignName ?? null,
          smartlead_pushed_at:     new Date().toISOString(),
          updated_at:              new Date().toISOString(),
        })
        .in("id", pushedJobIds);
    }

    return NextResponse.json({
      success: errors.length === 0,
      campaign_id: String(campaignId),
      total_sent:  withLead.length,
      uploaded,
      duplicates,
      invalid,
      skipped_no_email: missingEmail.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

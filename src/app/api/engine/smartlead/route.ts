// ═══════════════════════════════════════════════════════════════════════════
// /api/engine/smartlead
//
// Thin Next-side wrapper around the `smartleads` Supabase edge function.
//
//   GET  ?action=ping       → validates SmartLead API key
//   GET  ?action=campaigns  → lists SmartLead campaigns
//   POST (body below)       → pushes selected job_leads into a campaign
//
// POST body:  { jobIds: string[], campaignId: string|number, campaignName?: string }
// POST response (success):
//   {
//     success: boolean,                 // false if any batch failed
//     partial_success?: boolean,        // true if some batches uploaded but others failed
//     campaign_id: string,
//     total_sent:   number,             // leads sent to SmartLead (had valid email)
//     uploaded:     number,             // SmartLead accepted + queued
//     duplicates:   number,             // already in campaign
//     invalid:      number,             // SmartLead rejected (blocklist/bounce/malformed)
//     skipped_no_email: number,         // filtered out before sending
//     db_sync_failed?: boolean,         // SmartLead got the leads but DB update failed
//     errors?: string[],
//   }
//
// Every call is logged to `engine_api_usage` and successful pushes also append
// rows to `engine_stage_transitions`, matching the pattern used by the other
// engine pipeline steps.
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin, edgeFnUrl } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";
import {
  SMARTLEAD_BATCH_SIZE,
  SMARTLEAD_PUSHABLE_STATUSES,
  SMARTLEAD_TIMEOUT_ADD_MS,
  SMARTLEAD_TIMEOUT_PING_MS,
  chunk,
  jobToSmartLead,
  type SmartLeadJobRow,
} from "@/lib/smartlead";

export const dynamic    = "force-dynamic";
export const maxDuration = 290;

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY         = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ── Low-level edge fn caller ───────────────────────────────────────────────

type EdgeResponse = { status: number; data: unknown; latencyMs: number };

async function callSmartLead(body: Record<string, unknown>, timeoutMs: number): Promise<EdgeResponse> {
  if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured");
  if (!SERVICE_ROLE_KEY && !ANON_KEY) throw new Error("No Supabase keys configured");

  const started = Date.now();
  const res = await fetch(edgeFnUrl("smartleads"), {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${SERVICE_ROLE_KEY || ANON_KEY}`,
      apikey:         ANON_KEY,
    },
    body:   JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const latencyMs = Date.now() - started;

  const ct = res.headers.get("content-type") ?? "";
  let data: unknown;
  if (ct.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = { error: `[smartleads] HTTP ${res.status}: ${text.slice(0, 300)}` };
  }
  return { status: res.status, data, latencyMs };
}

// ── Audit logging helpers (best-effort — never throw) ──────────────────────

type Db = ReturnType<typeof getEngineAdmin>;

async function logApiUsage(
  db: Db,
  op: string,
  jobId: string | null,
  latencyMs: number,
  success: boolean,
  statusCode: number,
  errorMsg: string | null,
): Promise<void> {
  try {
    await db.from("engine_api_usage").insert({
      api:         "smartlead",
      operation:   op,
      job_id:      jobId,
      cost_usd:    0,
      latency_ms:  latencyMs,
      success,
      status_code: statusCode,
      error_msg:   errorMsg,
    });
  } catch (err) {
    console.error("[smartlead] failed to log api_usage:", err);
  }
}

async function logStageTransitions(
  db: Db,
  jobIds: string[],
  fromStages: Map<string, string>,
  campaignId: string,
): Promise<void> {
  if (!jobIds.length) return;
  try {
    const rows = jobIds.map((id) => ({
      job_id:     id,
      from_stage: fromStages.get(id) ?? "unknown",
      to_stage:   "smartleaded",
      reason:     `Pushed to SmartLead campaign ${campaignId}`,
      cost_usd:   0,
      success:    true,
    }));
    await db.from("engine_stage_transitions").insert(rows);
  } catch (err) {
    console.error("[smartlead] failed to log stage_transitions:", err);
  }
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  const action = req.nextUrl.searchParams.get("action") ?? "ping";
  if (action !== "ping" && action !== "campaigns") {
    return NextResponse.json({ error: "action must be 'ping' or 'campaigns'" }, { status: 400 });
  }

  const db = getEngineAdmin();
  const edgeAction = action === "campaigns" ? "list_campaigns" : "ping";

  try {
    const { status, data, latencyMs } = await callSmartLead(
      { action: edgeAction },
      SMARTLEAD_TIMEOUT_PING_MS,
    );
    const success = status >= 200 && status < 300;
    await logApiUsage(db, edgeAction, null, latencyMs, success, status,
      success ? null : JSON.stringify(data).slice(0, 500));
    return NextResponse.json(data, { status });
  } catch (err) {
    const msg = extractErrorMsg(err);
    await logApiUsage(db, edgeAction, null, 0, false, 502, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────

interface PostBody {
  jobIds?:       string[];
  campaignId?:   string | number;
  campaignName?: string;
}

export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  const db = getEngineAdmin();

  try {
    const body = (await req.json().catch(() => ({}))) as PostBody;
    const jobIds       = Array.isArray(body.jobIds) ? body.jobIds : [];
    const campaignId   = body.campaignId;
    const campaignName = body.campaignName;

    if (jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds array is required" }, { status: 400 });
    }
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    // Fetch eligible jobs only — rejects already-dismissed / already-smartleaded.
    //
    // HARD DM REQUIREMENT: the query also enforces dm_name + (dm_email OR
    // dm_linkedin_url). This mirrors the "enriched" stage definition and means
    // a job without a Decision Maker can NEVER be pushed to SmartLead, even
    // if the caller somehow selected one. Enforced at DB layer + mapper layer
    // (jobToSmartLead) for defense-in-depth.
    const { data: jobsRaw, error: fetchErr } = await db
      .from("job_leads")
      .select("*")
      .in("id", jobIds)
      .in("status", SMARTLEAD_PUSHABLE_STATUSES as unknown as string[])
      .not("dm_name", "is", null)
      .or("dm_email.not.is.null,dm_linkedin_url.not.is.null");

    if (fetchErr) throw fetchErr;
    const jobs = (jobsRaw ?? []) as (SmartLeadJobRow & { status: string })[];
    if (jobs.length === 0) {
      return NextResponse.json(
        { error: "No eligible jobs found (must be enriched or CRM-pushed)" },
        { status: 404 },
      );
    }

    // Remember from-stages for audit log
    const fromStages = new Map<string, string>();
    for (const j of jobs) fromStages.set(j.id, j.status);

    // Partition: mappable vs no-email
    const mapped = jobs.map((j) => ({ job: j, lead: jobToSmartLead(j) }));
    const withLead     = mapped.filter((m): m is { job: typeof m.job; lead: NonNullable<typeof m.lead> } => m.lead !== null);
    const missingEmailIds = mapped.filter((m) => m.lead === null).map((m) => m.job.id);

    if (withLead.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No selected jobs have a valid email address — enrich them first",
        skipped_no_email: missingEmailIds.length,
      }, { status: 400 });
    }

    // ── Dispatch batches ────────────────────────────────────────────────────
    const batches = chunk(withLead, SMARTLEAD_BATCH_SIZE);

    let uploaded   = 0;
    let duplicates = 0;
    let invalid    = 0;
    const successfulJobIds: string[] = [];
    const failedBatchJobIds: string[] = [];
    const errors: string[] = [];

    for (const batch of batches) {
      const batchIds = batch.map((m) => m.job.id);
      try {
        const { status, data, latencyMs } = await callSmartLead({
          action:      "add_leads",
          campaign_id: campaignId,
          leads:       batch.map((m) => m.lead),
        }, SMARTLEAD_TIMEOUT_ADD_MS);

        const d = data as Record<string, unknown>;
        const ok = status >= 200 && status < 300 && d.success === true;

        await logApiUsage(
          db, "add_leads", null, latencyMs, ok, status,
          ok ? null : JSON.stringify(d.error ?? d).slice(0, 500),
        );

        if (ok) {
          const batchUploaded   = Number(d.uploaded   ?? 0);
          const batchDuplicates = Number(d.duplicates ?? 0);
          const batchInvalid    = Number(d.invalid    ?? 0);

          uploaded   += batchUploaded;
          duplicates += batchDuplicates;
          invalid    += batchInvalid;

          // SmartLead's response is aggregate (not per-lead), so we cannot
          // precisely identify WHICH leads were invalid. Heuristic:
          // if the entire batch uploaded cleanly (no invalids), mark all.
          // Otherwise, mark only the ones that SmartLead accepted (uploaded +
          // duplicates), and leave the invalid_count behind for retry.
          if (batchInvalid === 0) {
            successfulJobIds.push(...batchIds);
          } else {
            // Best-effort: mark first (uploaded + duplicates) as successful.
            // SmartLead doesn't tell us the order, so this is approximate.
            // The conservative alternative — marking none — would block
            // successful leads from being tracked, so we accept approximation.
            const countToMark = batchUploaded + batchDuplicates;
            successfulJobIds.push(...batchIds.slice(0, countToMark));
            // Invalid ones stay in their original status, eligible for retry.
          }
        } else {
          failedBatchJobIds.push(...batchIds);
          errors.push(
            `Batch of ${batch.length}: HTTP ${status} — ${JSON.stringify(d.error ?? d).slice(0, 200)}`,
          );
        }
      } catch (batchErr) {
        failedBatchJobIds.push(...batchIds);
        const msg = extractErrorMsg(batchErr);
        errors.push(`Batch of ${batch.length}: ${msg}`);
        await logApiUsage(db, "add_leads", null, 0, false, 0, msg);
      }
    }

    // ── Persist results to DB ───────────────────────────────────────────────
    let dbSyncFailed = false;

    if (successfulJobIds.length > 0) {
      const nowIso = new Date().toISOString();
      const { error: updErr } = await db
        .from("job_leads")
        .update({
          status:                  "pushed_to_smartlead",
          smartlead_campaign_id:   String(campaignId),
          smartlead_campaign_name: campaignName ?? null,
          smartlead_pushed_at:     nowIso,
          smartlead_error:         null,
          updated_at:              nowIso,
        })
        .in("id", successfulJobIds);

      if (updErr) {
        dbSyncFailed = true;
        console.error("[smartlead] DB sync failed after successful SmartLead push:", updErr);
        errors.push(`DB sync failed: ${updErr.message}`);
      } else {
        await logStageTransitions(db, successfulJobIds, fromStages, String(campaignId));
      }
    }

    // Stamp error on fully-failed batch jobs for visibility
    if (failedBatchJobIds.length > 0) {
      await db
        .from("job_leads")
        .update({
          smartlead_error: `Push failed: ${errors[0]?.slice(0, 200) ?? "unknown"}`,
          updated_at:      new Date().toISOString(),
        })
        .in("id", failedBatchJobIds);
    }

    const allBatchesSucceeded = failedBatchJobIds.length === 0;

    return NextResponse.json({
      success:         allBatchesSucceeded && !dbSyncFailed,
      partial_success: !allBatchesSucceeded && successfulJobIds.length > 0,
      campaign_id:     String(campaignId),
      total_sent:      withLead.length,
      uploaded,
      duplicates,
      invalid,
      skipped_no_email: missingEmailIds.length,
      db_sync_failed:   dbSyncFailed || undefined,
      errors:           errors.length ? errors : undefined,
    });
  } catch (err) {
    const msg = extractErrorMsg(err);
    await logApiUsage(db, "push", null, 0, false, 500, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export const dynamic = "force-dynamic";

// GET /api/engine/jobs — list job_leads with optional filters
export async function GET(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const db = getEngineAdmin();
    const url = new URL(req.url);
    const status  = url.searchParams.get("status");
    const stage   = url.searchParams.get("stage");
    const source  = url.searchParams.get("source");
    const country = url.searchParams.get("country");
    const search  = url.searchParams.get("search");
    const limit   = Math.min(Number(url.searchParams.get("limit")) || 200, 500);
    const offset  = Number(url.searchParams.get("offset")) || 0;

    let query = db
      .from("job_leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Stage filter — computed from existing fields (mirrors computeStage in lib/pipelineStage.ts)
    if (stage) {
      switch (stage) {
        case "pending":
          query = query
            .is("ai_enriched_at", null)
            .not("status", "in", "(pushed_to_crm,pushed_to_smartlead,dismissed,recruiter_dismissed)");
          break;
        case "qualified":
          query = query
            .not("ai_enriched_at", "is", null)
            .gte("ai_relevance_score", 6)
            .eq("ai_poster_type", "internal")
            .is("dm_name", null)
            .lt("dm_attempts", 3)
            .not("status", "in", "(pushed_to_crm,pushed_to_smartlead,dismissed,recruiter_dismissed)");
          break;
        case "dead_end":
          query = query
            .not("ai_enriched_at", "is", null)
            .is("dm_name", null)
            .or("ai_relevance_score.lt.6,ai_poster_type.neq.internal")
            .not("status", "in", "(pushed_to_crm,pushed_to_smartlead,dismissed,recruiter_dismissed)");
          break;
        case "stuck_no_dm":
          query = query
            .not("ai_enriched_at", "is", null)
            .is("dm_name", null)
            .gte("dm_attempts", 3)
            .not("status", "in", "(pushed_to_crm,pushed_to_smartlead,dismissed,recruiter_dismissed)");
          break;
        case "enriched":
          query = query
            .not("dm_name", "is", null)
            .or("dm_email.not.is.null,dm_linkedin_url.not.is.null")
            .not("status", "in", "(pushed_to_crm,pushed_to_smartlead,dismissed,recruiter_dismissed)");
          break;
        case "pushed":
          query = query.eq("status", "pushed_to_crm");
          break;
        case "smartleaded":
          query = query.eq("status", "pushed_to_smartlead");
          break;
        case "dismissed":
          query = query.in("status", ["dismissed", "recruiter_dismissed"]);
          break;
      }
    }

    if (status)  query = query.eq("status", status);
    if (source)  query = query.eq("source", source);
    if (country) query = query.eq("country", country);
    if (search) {
      // Sanitize: strip characters that could break PostgREST filter syntax
      const safe = search.replace(/[%_(),."'\\]/g, "").trim().slice(0, 100);
      if (safe) query = query.or(`company_name.ilike.%${safe}%,job_title.ilike.%${safe}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, jobs: data ?? [], count });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

// DELETE /api/engine/jobs — hard-delete jobs by id
// Body: { jobIds: string[] }
//
// Refuses to delete jobs already pushed to CRM/SmartLead (audit integrity).
// Related audit rows (engine_stage_transitions, engine_api_usage) are kept
// for historical analysis — they reference job_id by string, not FK.
export async function DELETE(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const body = (await req.json().catch(() => ({}))) as { jobIds?: unknown };
    const rawIds = Array.isArray(body.jobIds) ? body.jobIds : [];
    const jobIds = rawIds.filter((x): x is string => typeof x === "string" && x.length > 0);

    if (jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds array is required" }, { status: 400 });
    }
    if (jobIds.length > 500) {
      return NextResponse.json({ error: "max 500 jobs per delete" }, { status: 400 });
    }

    const db = getEngineAdmin();

    // Safety: refuse to delete jobs that are already pushed (preserves audit trail)
    const { data: pushed, error: checkErr } = await db
      .from("job_leads")
      .select("id, status")
      .in("id", jobIds)
      .in("status", ["pushed_to_crm", "pushed_to_smartlead"]);
    if (checkErr) throw checkErr;

    if (pushed && pushed.length > 0) {
      return NextResponse.json({
        error: `Cannot delete ${pushed.length} job(s) already pushed to CRM/SmartLead — dismiss them instead`,
        blocked_ids: pushed.map((p) => p.id),
      }, { status: 409 });
    }

    const { data, error } = await db
      .from("job_leads").delete().in("id", jobIds).select("id");
    if (error) throw error;

    return NextResponse.json({ success: true, deleted: data?.length ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

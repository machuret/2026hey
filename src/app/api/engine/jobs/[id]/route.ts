import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// Fields allowed to be updated via PATCH
const ALLOWED_FIELDS = new Set([
  "status", "job_title", "company_name", "company_website", "company_industry",
  "company_size", "location", "country", "salary", "work_type", "work_arrangement",
  "description", "emails", "phone_numbers", "recruiter_name", "recruiter_phone",
  "recruiter_agency", "recruiter_website", "search_query",
  // Enrichment fields (written by enrich pipeline)
  "ai_company_summary", "ai_hiring_signal", "ai_relevance_score",
  "ai_relevance_reason", "ai_suggested_dm_title", "ai_enriched_at",
  "dm_name", "dm_title", "dm_email", "dm_phone", "dm_mobile",
  "dm_linkedin_url", "dm_enriched_at",
  "li_company_url", "li_company_desc", "li_company_size",
  "li_industry", "li_hq_location", "li_enriched_at",
]);

// PATCH /api/engine/jobs/[id] — update a job lead (allowlisted fields only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const body = await req.json();

    // Only allow known fields through
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) patch[key] = value;
    }

    const { data, error } = await db
      .from("job_leads")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, job: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/engine/jobs/[id] — delete a job lead
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const { error } = await db.from("job_leads").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

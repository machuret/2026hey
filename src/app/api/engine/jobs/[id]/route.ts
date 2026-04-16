import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";

export const dynamic = "force-dynamic";

// Fields allowed to be updated via PATCH
const ALLOWED_FIELDS = new Set([
  "status", "job_title", "company_name", "company_website", "company_industry",
  "company_size", "location", "country", "salary", "work_type", "work_arrangement",
  "job_category", "description", "emails", "phone_numbers", "recruiter_name",
  "recruiter_phone", "recruiter_agency", "recruiter_website", "search_query",
  // AI enrichment fields (deep classification)
  "ai_company_summary", "ai_hiring_signal", "ai_relevance_score",
  "ai_relevance_reason", "ai_suggested_dm_title", "ai_enriched_at",
  "ai_poster_type", "ai_poster_reason",
  "ai_role_seniority", "ai_role_function", "ai_required_skills",
  "ai_required_experience", "ai_required_certifications", "ai_employment_type",
  "ai_urgency", "ai_urgency_clues", "ai_team_size_clue", "ai_reports_to",
  "ai_company_pain_points", "ai_work_model", "ai_industry_vertical",
  "ai_salary_normalized", "ai_benefits_summary",
  "ai_candidate_persona", "ai_pitch_angle", "ai_email_snippet", "ai_objection_preempt",
  // DM enrichment
  "dm_name", "dm_title", "dm_email", "dm_phone", "dm_mobile",
  "dm_linkedin_url", "dm_enriched_at",
  // LinkedIn enrichment
  "li_company_url", "li_company_desc", "li_company_size",
  "li_industry", "li_hq_location", "li_enriched_at",
]);

// PATCH /api/engine/jobs/[id] — update a job lead (allowlisted fields only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

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

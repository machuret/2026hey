import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// POST /api/engine/jobs/import — save scraped jobs to DB with dedup
export async function POST(req: NextRequest) {
  try {
    const db = getEngineAdmin();
    const { jobs, searchQuery } = await req.json();

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: "No jobs provided" }, { status: 400 });
    }

    // Dedup: check existing source+source_id pairs
    const sourceIds = jobs.map((j: Record<string, unknown>) => String(j.source_id));
    const source = String(jobs[0].source || "seek");

    const { data: existing } = await db
      .from("job_leads")
      .select("source_id")
      .eq("source", source)
      .in("source_id", sourceIds);

    const existingIds = new Set((existing ?? []).map((r: { source_id: string }) => r.source_id));

    const deduped = jobs.filter(
      (j: Record<string, unknown>) => !existingIds.has(String(j.source_id)),
    );

    const skipped = jobs.length - deduped.length;

    if (deduped.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped,
        message: "All jobs already exist in database",
      });
    }

    const rows = deduped.map((j: Record<string, unknown>) => ({
      source_id:         String(j.source_id),
      source:            String(j.source || "seek"),
      job_title:         String(j.job_title || "Untitled"),
      job_url:           j.job_url ? String(j.job_url) : null,
      company_name:      j.company_name ? String(j.company_name) : null,
      company_website:   j.company_website ? String(j.company_website) : null,
      company_industry:  j.company_industry ? String(j.company_industry) : null,
      company_size:      j.company_size ? String(j.company_size) : null,
      location:          j.location ? String(j.location) : null,
      country:           j.country ? String(j.country) : null,
      salary:            j.salary ? String(j.salary) : null,
      work_type:         j.work_type ? String(j.work_type) : null,
      work_arrangement:  j.work_arrangement ? String(j.work_arrangement) : null,
      description:       j.description ? String(j.description) : null,
      emails:            Array.isArray(j.emails) ? j.emails : [],
      phone_numbers:     Array.isArray(j.phone_numbers) ? j.phone_numbers : [],
      recruiter_name:    j.recruiter_name ? String(j.recruiter_name) : null,
      recruiter_phone:   j.recruiter_phone ? String(j.recruiter_phone) : null,
      recruiter_agency:  j.recruiter_agency ? String(j.recruiter_agency) : null,
      recruiter_website: j.recruiter_website ? String(j.recruiter_website) : null,
      listed_at:         j.listed_at ? String(j.listed_at) : null,
      expires_at:        j.expires_at ? String(j.expires_at) : null,
      search_query:      searchQuery ? String(searchQuery) : null,
      status:            "new",
      updated_at:        new Date().toISOString(),
    }));

    const { data, error } = await db.from("job_leads").insert(rows).select();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      imported: data?.length ?? 0,
      skipped,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

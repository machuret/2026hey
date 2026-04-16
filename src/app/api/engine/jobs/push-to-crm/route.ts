import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// POST /api/engine/jobs/push-to-crm — push selected job leads into crm_leads
export async function POST(req: NextRequest) {
  try {
    const db = getEngineAdmin();
    const { jobIds } = await req.json();

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds array is required" }, { status: 400 });
    }

    // Fetch the job leads
    const { data: jobs, error: fetchErr } = await db
      .from("job_leads")
      .select("*")
      .in("id", jobIds);

    if (fetchErr) throw fetchErr;
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: "No jobs found" }, { status: 404 });
    }

    // Build CRM lead rows from job data
    const crmRows = jobs.map((j: Record<string, unknown>) => {
      const jEmails = j.emails as string[] | null;
      const jPhones = j.phone_numbers as string[] | null;
      // Best contact: DM > recruiter > listing emails
      const email = j.dm_email || (jEmails?.length ? jEmails[0] : null);
      const phone = j.dm_phone || j.dm_mobile || j.recruiter_phone || (jPhones?.length ? jPhones[0] : null);
      const name  = j.dm_name || j.recruiter_name || j.company_name || "Unknown";

      return {
        name,
        email,
        phone,
        company:        j.company_name,
        industry:       j.company_industry || j.li_industry || null,
        website:        j.company_website || j.li_company_url || null,
        pipeline_stage: "new",
        tags:           ["job_lead", j.source].filter(Boolean),
        source:         "scraper",
        notes:          [
          j.job_title ? `Job: ${j.job_title}` : null,
          j.ai_company_summary ? `Company: ${j.ai_company_summary}` : null,
          j.ai_hiring_signal ? `Hiring signal: ${j.ai_hiring_signal}` : null,
          j.ai_relevance_score ? `AI Score: ${j.ai_relevance_score}/10 — ${j.ai_relevance_reason || ""}` : null,
          j.dm_title ? `DM Title: ${j.dm_title}` : null,
          j.job_url ? `Listing URL: ${j.job_url}` : null,
        ].filter(Boolean).join("\n"),
        updated_at:      new Date().toISOString(),
      };
    });

    // Dedup against existing CRM leads by email or phone
    const emails = crmRows.map((r: Record<string, unknown>) => r.email).filter(Boolean) as string[];
    const phones = crmRows.map((r: Record<string, unknown>) => r.phone).filter(Boolean) as string[];

    let existingEmails = new Set<string>();
    let existingPhones = new Set<string>();

    if (emails.length || phones.length) {
      const orParts = [
        emails.length ? `email.in.(${emails.map((e) => `"${e}"`).join(",")})` : null,
        phones.length ? `phone.in.(${phones.map((p) => `"${p}"`).join(",")})` : null,
      ].filter(Boolean).join(",");

      const { data: existing } = await db
        .from("crm_leads")
        .select("phone, email")
        .or(orParts);

      existingEmails = new Set((existing ?? []).map((r: Record<string, unknown>) => r.email as string).filter(Boolean));
      existingPhones = new Set((existing ?? []).map((r: Record<string, unknown>) => r.phone as string).filter(Boolean));
    }

    const deduped = crmRows.filter((r: Record<string, unknown>) => {
      if (r.email && existingEmails.has(r.email as string)) return false;
      if (r.phone && existingPhones.has(r.phone as string)) return false;
      return true;
    });

    const skipped = crmRows.length - deduped.length;

    let imported = 0;
    if (deduped.length > 0) {
      const { data: inserted, error: insertErr } = await db
        .from("crm_leads")
        .insert(deduped)
        .select();
      if (insertErr) throw insertErr;
      imported = inserted?.length ?? 0;
    }

    // Mark job leads as pushed
    await db
      .from("job_leads")
      .update({ status: "pushed_to_crm", updated_at: new Date().toISOString() })
      .in("id", jobIds);

    return NextResponse.json({ success: true, imported, skipped });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// POST /api/engine/leads/import — bulk import scraped leads into CRM
export async function POST(req: NextRequest) {
  try {
    const db = getEngineAdmin();
    const { leads } = await req.json();
    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
    }

    // ── Duplicate detection ──────────────────────────────────────────
    // Collect all phones + emails from the incoming batch
    const phones  = leads.map((l: Record<string, unknown>) => l.phone).filter(Boolean) as string[];
    const emails  = leads.map((l: Record<string, unknown>) => l.email).filter(Boolean) as string[];

    // Query existing records that match any phone or email
    const { data: existing } = await db
      .from("crm_leads")
      .select("phone, email")
      .or(
        [
          phones.length  ? `phone.in.(${phones.map((p) => `"${p}"`).join(",")})` : null,
          emails.length  ? `email.in.(${emails.map((e) => `"${e}"`).join(",")})` : null,
        ].filter(Boolean).join(","),
      );

    const existingPhones = new Set((existing ?? []).map((r) => r.phone).filter(Boolean));
    const existingEmails = new Set((existing ?? []).map((r) => r.email).filter(Boolean));

    // Filter out duplicates
    const deduped = leads.filter((l: Record<string, unknown>) => {
      if (l.phone && existingPhones.has(String(l.phone))) return false;
      if (l.email && existingEmails.has(String(l.email))) return false;
      return true;
    });

    const skipped = leads.length - deduped.length;

    if (deduped.length === 0) {
      return NextResponse.json({ success: true, imported: 0, skipped, message: "All leads already exist in CRM" });
    }

    const rows = deduped.map((l: Record<string, unknown>) => ({
      name:             String(l.name ?? l.company ?? "Unknown"),
      email:            l.email    ? String(l.email)    : null,
      phone:            l.phone    ? String(l.phone)    : null,
      company:          l.company  ? String(l.company)  : null,
      industry:         l.industry ? String(l.industry) : null,
      website:          l.website  ? String(l.website)  : null,
      pipeline_stage:   "new",
      tags:             Array.isArray(l.ai_signals) ? l.ai_signals : [],
      source:           "scraper",
      // AI scoring fields (populated after qualify step)
      ai_score:         l.ai_score         ? Number(l.ai_score)         : null,
      ai_score_reason:  l.ai_score_reason  ? String(l.ai_score_reason)  : null,
      ai_signals:       Array.isArray(l.ai_signals) ? l.ai_signals      : [],
      call_opener:      l.call_opener      ? String(l.call_opener)      : null,
      enriched_at:      l.enriched_at      ? String(l.enriched_at)      : null,
      updated_at:       new Date().toISOString(),
    }));

    const { data, error } = await db.from("crm_leads").insert(rows).select();
    if (error) throw error;
    return NextResponse.json({ success: true, imported: data?.length ?? 0, skipped });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

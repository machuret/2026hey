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

    const rows = leads.map((l: Record<string, unknown>) => ({
      name:           String(l.name ?? "Unknown"),
      email:          l.email   ? String(l.email)   : null,
      phone:          l.phone   ? String(l.phone)   : null,
      company:        l.company ? String(l.company) : null,
      industry:       l.industry ? String(l.industry) : null,
      website:        l.website ? String(l.website) : null,
      pipeline_stage: "new",
      tags:           [],
      source:         "scraper",
      updated_at:     new Date().toISOString(),
    }));

    const { data, error } = await db.from("crm_leads").insert(rows).select();
    if (error) throw error;
    return NextResponse.json({ success: true, imported: data?.length ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

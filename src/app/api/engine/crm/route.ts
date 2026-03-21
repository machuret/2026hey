import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// GET /api/engine/crm — list all leads, optional ?stage= filter
export async function GET(req: NextRequest) {
  try {
    const db = getEngineAdmin();
    const stage = req.nextUrl.searchParams.get("stage");
    let query = db.from("crm_leads").select("*").order("created_at", { ascending: false });
    if (stage) query = query.eq("pipeline_stage", stage);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ leads: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/engine/crm — create a new lead
export async function POST(req: NextRequest) {
  try {
    const db = getEngineAdmin();
    const body = await req.json();
    const { data, error } = await db.from("crm_leads").insert({
      name:           body.name,
      email:          body.email          ?? null,
      phone:          body.phone          ?? null,
      company:        body.company        ?? null,
      industry:       body.industry       ?? null,
      website:        body.website        ?? null,
      pipeline_stage: body.pipeline_stage ?? "new",
      tags:           body.tags           ?? [],
      notes:          body.notes          ?? null,
      source:         body.source         ?? "manual",
      updated_at:     new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, lead: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

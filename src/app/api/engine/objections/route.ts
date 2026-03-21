import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// GET /api/engine/objections
export async function GET() {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_objections")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) return NextResponse.json({ error: error.message, code: error.code, hasServiceKey }, { status: 500 });
    return NextResponse.json({ objections: data ?? [], hasServiceKey });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err), hasServiceKey }, { status: 500 });
  }
}

// POST /api/engine/objections
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 });

    const db = getEngineAdmin();
    const { data: existing } = await db
      .from("engine_objections")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order + 1) : 0;
    const { data, error } = await db
      .from("engine_objections")
      .insert({ label, sort_order: body.sort_order ?? nextOrder, is_active: body.is_active ?? true })
      .select("id, label, sort_order, is_active, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, objection: data });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create objection" }, { status: 500 });
  }
}

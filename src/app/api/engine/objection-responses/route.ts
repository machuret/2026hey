import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// GET /api/engine/objection-responses?objection_id=xxx
export async function GET(req: NextRequest) {
  const objection_id = req.nextUrl.searchParams.get("objection_id");
  if (!objection_id) return NextResponse.json({ error: "objection_id is required" }, { status: 400 });

  try {
    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_objection_responses")
      .select("id, objection_id, body, sort_order, created_at")
      .eq("objection_id", objection_id)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ responses: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 });
  }
}

// POST /api/engine/objection-responses
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const objection_id = typeof body.objection_id === "string" ? body.objection_id.trim() : "";
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!objection_id) return NextResponse.json({ error: "objection_id is required" }, { status: 400 });
    if (!text) return NextResponse.json({ error: "body is required" }, { status: 400 });

    const db = getEngineAdmin();
    const { data: existing } = await db
      .from("engine_objection_responses")
      .select("sort_order")
      .eq("objection_id", objection_id)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const { data, error } = await db
      .from("engine_objection_responses")
      .insert({ objection_id, body: text, sort_order: body.sort_order ?? nextOrder })
      .select("id, objection_id, body, sort_order, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, response: data });
  } catch {
    return NextResponse.json({ error: "Failed to create response" }, { status: 500 });
  }
}

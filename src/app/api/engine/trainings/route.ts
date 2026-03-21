import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// GET /api/engine/trainings — list all trainings
export async function GET() {
  try {
    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_trainings")
      .select("*")
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return NextResponse.json({ trainings: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/engine/trainings — create a training
export async function POST(req: NextRequest) {
  try {
    const db = getEngineAdmin();
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!body.prompt?.trim()) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

    const { data, error } = await db.from("engine_trainings").insert({
      name:        body.name.trim(),
      description: body.description?.trim() ?? null,
      prompt:      body.prompt.trim(),
      voice:       body.voice ?? "alloy",
      is_active:   body.is_active ?? true,
      sort_order:  body.sort_order ?? 0,
      updated_at:  new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, training: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

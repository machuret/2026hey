import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// PATCH /api/engine/trainings/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const body = await req.json();
    const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name        !== undefined) fields.name        = body.name;
    if (body.description !== undefined) fields.description = body.description;
    if (body.prompt      !== undefined) fields.prompt      = body.prompt;
    if (body.voice       !== undefined) fields.voice       = body.voice;
    if (body.is_active   !== undefined) fields.is_active   = body.is_active;
    if (body.sort_order  !== undefined) fields.sort_order  = body.sort_order;
    const { data, error } = await db.from("engine_trainings").update(fields).eq("id", id).select().single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Training not found" }, { status: 404 });
    return NextResponse.json({ success: true, training: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/engine/trainings/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const { error } = await db.from("engine_trainings").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

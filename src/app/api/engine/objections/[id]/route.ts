import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// PATCH /api/engine/objections/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_objections")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, objection: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/engine/objections/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const { error } = await db.from("engine_objections").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

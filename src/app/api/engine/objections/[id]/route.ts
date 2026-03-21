import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// PATCH /api/engine/objections/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Whitelist — only allow safe fields to be updated
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.label === "string" && body.label.trim()) patch.label = body.label.trim();
    if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
    if (typeof body.sort_order === "number") patch.sort_order = body.sort_order;

    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_objections")
      .update(patch)
      .eq("id", id)
      .select("id, label, sort_order, is_active, created_at, updated_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, objection: data });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update objection" }, { status: 500 });
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

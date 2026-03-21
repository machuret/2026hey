import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// PATCH /api/engine/objection-responses/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.body === "string" && body.body.trim()) patch.body = body.body.trim();
    if (typeof body.sort_order === "number") patch.sort_order = body.sort_order;

    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_objection_responses")
      .update(patch)
      .eq("id", id)
      .select("id, objection_id, body, sort_order, created_at, updated_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, response: data });
  } catch {
    return NextResponse.json({ error: "Failed to update response" }, { status: 500 });
  }
}

// DELETE /api/engine/objection-responses/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const { error } = await db.from("engine_objection_responses").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete response" }, { status: 500 });
  }
}

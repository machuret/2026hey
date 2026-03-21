import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/engine/transcribe/[id] — fetch full transcript content
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_transcripts")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    return NextResponse.json({ transcript: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/engine/transcribe/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const { error } = await db.from("engine_transcripts").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/engine/transcribe/[id] — save OpenAI analysis back to record
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const body = await req.json();
    if (typeof body.analysis !== "string") {
      return NextResponse.json({ error: "analysis must be a string" }, { status: 400 });
    }
    const { data, error } = await db
      .from("engine_transcripts")
      .update({ analysis: body.analysis })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    return NextResponse.json({ success: true, transcript: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

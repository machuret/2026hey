import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin, proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/engine/transcribe — run transcription via edge function
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyEdgeFn("engine-transcribe", "POST", req, {}, body);
}

// GET /api/engine/transcribe — list stored transcripts
export async function GET() {
  try {
    const db = getEngineAdmin();
    const { data, error } = await db
      .from("engine_transcripts")
      .select("id, title, author, source, source_url, analysis, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ transcripts: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

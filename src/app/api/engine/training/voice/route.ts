import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic     = "force-dynamic";
export const maxDuration = 40;

// POST /api/engine/training/voice
// Proxies to Supabase edge function engine-training-voice.
// Moved to edge to eliminate Node.js Buffer dependency and reduce cold-start latency.
// Body:    { messages: [{role, content}], prompt: string, voice?: string }
// Returns: { reply: string, audio: string | null }
export async function POST(req: NextRequest) {
  return proxyEdgeFn("engine-training-voice", "POST", req, {}, await req.json(), 38_000);
}

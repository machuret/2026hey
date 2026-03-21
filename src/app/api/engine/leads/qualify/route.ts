import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/engine/leads/qualify
// Body: { leads: Lead[], scoringPrompt?: string, useClaudeForBorderline?: boolean }
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyEdgeFn("engine-leads-qualify", "POST", req, {}, body);
}

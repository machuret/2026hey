import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/engine/leads/enrich
// Body: { leads: Lead[], actors?: string[] }
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyEdgeFn("engine-leads-enrich", "POST", req, {}, body);
}

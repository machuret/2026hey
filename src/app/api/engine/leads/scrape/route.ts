import { NextRequest, NextResponse } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/engine/leads/scrape — proxy to engine-leads-scrape edge fn
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyEdgeFn("engine-leads-scrape", "POST", req, {}, body);
}

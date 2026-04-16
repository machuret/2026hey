import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

// POST /api/engine/jobs/scrape — proxy to engine-jobs-scrape edge fn
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyEdgeFn("engine-jobs-scrape", "POST", req, {}, body, 170_000);
}

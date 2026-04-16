import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

// POST /api/engine/jobs/scrape — proxy to engine-jobs-scrape edge fn
export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  const body = await req.json();
  return proxyEdgeFn("engine-jobs-scrape", "POST", req, {}, body, 170_000);
}

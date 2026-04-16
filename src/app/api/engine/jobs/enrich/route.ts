import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST /api/engine/jobs/enrich — proxy to engine-jobs-enrich edge fn
export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  const body = await req.json();
  return proxyEdgeFn("engine-jobs-enrich", "POST", req, {}, body, 290_000);
}

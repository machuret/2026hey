import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST /api/engine/jobs/enrich — proxy to engine-jobs-enrich edge fn
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyEdgeFn("engine-jobs-enrich", "POST", req, {}, body, 290_000);
}

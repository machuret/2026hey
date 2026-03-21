import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyEdgeFn("engine-leads-enrich", "POST", req, {}, { ...body, method: "apollo" });
}

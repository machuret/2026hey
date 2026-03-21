import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyEdgeFn("engine-leads-enrich", "POST", req, {}, { ...body, method: "apollo" });
}

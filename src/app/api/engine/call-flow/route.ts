import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin, proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// GET /api/engine/call-flow — list all trees
export async function GET() {
  try {
    const db = getEngineAdmin();
    const { data, error } = await db
      .from("call_flow_trees")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ trees: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/engine/call-flow — create a new tree
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyEdgeFn("engine-flow-crud", "POST", req, { target: "tree" }, body);
}

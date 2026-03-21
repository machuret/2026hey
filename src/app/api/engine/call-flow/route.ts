import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin, edgeFnUrl } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

function authHeader(req: NextRequest) {
  return req.headers.get("authorization") ?? `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
}

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

// POST /api/engine/call-flow — create a new tree (proxies to edge fn)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${edgeFnUrl("engine-flow-crud")}?target=tree`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(req),
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

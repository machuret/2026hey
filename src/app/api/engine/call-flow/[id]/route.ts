import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin, edgeFnUrl } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

function authHeader(req: NextRequest) {
  return req.headers.get("authorization") ?? `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
}

// GET /api/engine/call-flow/[id] — full tree with nodes
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const [{ data: tree, error: te }, { data: nodes, error: ne }] = await Promise.all([
      db.from("call_flow_trees").select("*").eq("id", id).single(),
      db.from("call_flow_nodes").select("*").eq("tree_id", id).order("sort_order"),
    ]);
    if (te) throw te;
    if (ne) throw ne;
    return NextResponse.json({ tree, nodes: nodes ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/engine/call-flow/[id] — update tree metadata
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetch(`${edgeFnUrl("engine-flow-crud")}?target=tree&id=${id}`, {
      method: "PATCH",
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

// DELETE /api/engine/call-flow/[id] — delete tree + all nodes (cascade)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(`${edgeFnUrl("engine-flow-crud")}?target=tree&id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader(req),
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/engine/call-flow/[id] — add a node to this tree
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetch(`${edgeFnUrl("engine-flow-crud")}?target=node`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(req),
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      },
      body: JSON.stringify({ ...body, tree_id: id }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

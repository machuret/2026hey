import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin, proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

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
    if (!tree) return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    return NextResponse.json({ tree, nodes: nodes ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/engine/call-flow/[id] — update tree metadata
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyEdgeFn("engine-flow-crud", "PATCH", req, { target: "tree", id }, body);
}

// DELETE /api/engine/call-flow/[id] — delete tree + all nodes (cascade)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyEdgeFn("engine-flow-crud", "DELETE", req, { target: "tree", id });
}

// POST /api/engine/call-flow/[id] — add a node to this tree
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyEdgeFn("engine-flow-crud", "POST", req, { target: "node" }, { ...body, tree_id: id });
}

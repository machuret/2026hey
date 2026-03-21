import { NextRequest } from "next/server";
import { proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// PATCH /api/engine/nodes/[id] — update a flow node
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyEdgeFn("engine-flow-crud", "PATCH", req, { target: "node", id }, body);
}

// DELETE /api/engine/nodes/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyEdgeFn("engine-flow-crud", "DELETE", req, { target: "node", id });
}

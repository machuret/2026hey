import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin, proxyEdgeFn } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

// GET /api/engine/crm/[id] — lead + call history
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const [{ data: lead, error: le }, { data: history, error: he }] = await Promise.all([
      db.from("crm_leads").select("*").eq("id", id).single(),
      db.from("crm_call_history").select("*").eq("lead_id", id).order("called_at", { ascending: false }),
    ]);
    if (le) throw le;
    if (he) throw he;
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ lead, history: history ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/engine/crm/[id] — update lead
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyEdgeFn("engine-crm-crud", "PATCH", req, { id }, body);
}

// DELETE /api/engine/crm/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyEdgeFn("engine-crm-crud", "DELETE", req, { id });
}

// POST /api/engine/crm/[id] — log a call
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyEdgeFn("engine-crm-crud", "POST", req, { id, action: "log_call" }, body);
}

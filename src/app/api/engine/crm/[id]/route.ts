import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin, edgeFnUrl } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

function authHeader(req: NextRequest) {
  return req.headers.get("authorization") ?? `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
}

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
    return NextResponse.json({ lead, history: history ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/engine/crm/[id] — update lead (proxies to edge fn)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetch(`${edgeFnUrl("engine-crm-crud")}?id=${id}`, {
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

// DELETE /api/engine/crm/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(`${edgeFnUrl("engine-crm-crud")}?id=${id}`, {
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

// POST /api/engine/crm/[id] — log a call
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetch(`${edgeFnUrl("engine-crm-crud")}?id=${id}&action=log_call`, {
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

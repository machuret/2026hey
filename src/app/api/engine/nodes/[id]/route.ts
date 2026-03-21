import { NextRequest, NextResponse } from "next/server";
import { edgeFnUrl } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";

function authHeader(req: NextRequest) {
  return req.headers.get("authorization") ?? `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
}

// PATCH /api/engine/nodes/[id] — update a flow node
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetch(`${edgeFnUrl("engine-flow-crud")}?target=node&id=${id}`, {
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

// DELETE /api/engine/nodes/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(`${edgeFnUrl("engine-flow-crud")}?target=node&id=${id}`, {
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

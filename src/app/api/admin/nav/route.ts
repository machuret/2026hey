import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("nav_items")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const sb = getSupabaseAdmin();
  const body = await req.json();
  const { data, error } = await sb.from("nav_items").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const sb = getSupabaseAdmin();
  const body = await req.json();
  // bulk reorder: array of { id, sort_order }
  if (Array.isArray(body)) {
    const updates = await Promise.all(
      body.map(({ id, ...fields }: { id: string; [k: string]: unknown }) =>
        sb.from("nav_items").update(fields).eq("id", id)
      )
    );
    const err = updates.find(u => u.error);
    if (err?.error) return NextResponse.json({ error: err.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  // single update
  const { id, ...fields } = body;
  const { data, error } = await sb.from("nav_items").update(fields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const sb = getSupabaseAdmin();
  const { id } = await req.json();
  const { error } = await sb.from("nav_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

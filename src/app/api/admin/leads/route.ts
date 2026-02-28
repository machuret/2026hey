import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const industry = searchParams.get("industry");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 20;

  const sb = getSupabaseAdmin();
  let query = sb.from("leads").select("*", { count: "exact" }).order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (industry && industry !== "all") query = query.eq("industry", industry);

  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("leads").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

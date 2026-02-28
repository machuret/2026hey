import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page");
  const sb = getSupabaseAdmin();
  let query = sb.from("page_content").select("*").order("section").order("field");
  if (page) query = query.eq("page", page);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const { page, section, field, value } = await req.json();
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("page_content")
    .upsert({ page, section, field, value }, { onConflict: "page,section,field" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("page_content")
    .upsert(body, { onConflict: "page,section,field" })
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

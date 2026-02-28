import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin();
  const page = req.nextUrl.searchParams.get("page");
  let query = sb.from("seo_meta").select("*").order("page");
  if (page) query = sb.from("seo_meta").select("*").eq("page", page);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const sb = getSupabaseAdmin();
  const { page, title, description } = await req.json();
  const { data, error } = await sb
    .from("seo_meta")
    .upsert({ page, title, description }, { onConflict: "page" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

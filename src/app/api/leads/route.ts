import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, whatsapp, business_type } = body;

    if (!name || !email || !business_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await getSupabase().from("leads").insert([
      {
        name,
        email,
        whatsapp: whatsapp || null,
        business_type,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

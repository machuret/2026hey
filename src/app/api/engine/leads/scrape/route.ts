import { NextRequest, NextResponse } from "next/server";
import { edgeFnUrl } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authHeader(req: NextRequest) {
  return req.headers.get("authorization") ?? `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
}

// POST /api/engine/leads/scrape — proxy to engine-leads-scrape edge fn
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(edgeFnUrl("engine-leads-scrape"), {
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

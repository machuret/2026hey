import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export const dynamic = "force-dynamic";

// GET /api/engine/jobs — list job_leads with optional filters
export async function GET(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const db = getEngineAdmin();
    const url = new URL(req.url);
    const status  = url.searchParams.get("status");
    const source  = url.searchParams.get("source");
    const country = url.searchParams.get("country");
    const search  = url.searchParams.get("search");
    const limit   = Math.min(Number(url.searchParams.get("limit")) || 200, 500);
    const offset  = Number(url.searchParams.get("offset")) || 0;

    let query = db
      .from("job_leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status)  query = query.eq("status", status);
    if (source)  query = query.eq("source", source);
    if (country) query = query.eq("country", country);
    if (search) {
      // Sanitize: strip characters that could break PostgREST filter syntax
      const safe = search.replace(/[%_(),."'\\]/g, "").trim().slice(0, 100);
      if (safe) query = query.or(`company_name.ilike.%${safe}%,job_title.ilike.%${safe}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, jobs: data ?? [], count });
  } catch (err) {
    return NextResponse.json({ error: extractErrorMsg(err) }, { status: 500 });
  }
}

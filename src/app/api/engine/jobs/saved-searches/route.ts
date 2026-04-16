import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";

export const dynamic = "force-dynamic";

// GET /api/engine/jobs/saved-searches — list all saved search templates
export async function GET(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const db = getEngineAdmin();
    const { data, error } = await db
      .from("job_saved_searches")
      .select("id, name, form_data, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const searches = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      form: row.form_data,
      created_at: row.created_at,
    }));

    return NextResponse.json({ success: true, searches });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/engine/jobs/saved-searches — create a new saved search
export async function POST(req: NextRequest) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const db = getEngineAdmin();
    const { name, form } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!form || typeof form !== "object") {
      return NextResponse.json({ error: "Form data is required" }, { status: 400 });
    }

    const { data, error } = await db
      .from("job_saved_searches")
      .insert({ name: name.trim(), form_data: form })
      .select("id, name, form_data, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      search: { id: data.id, name: data.name, form: data.form_data, created_at: data.created_at },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

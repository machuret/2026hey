import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";
import { requireEngineAuth } from "@/lib/engineAuth";

export const dynamic = "force-dynamic";

// DELETE /api/engine/jobs/saved-searches/[id] — delete a saved search
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = requireEngineAuth(req);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    const db = getEngineAdmin();
    const { error } = await db.from("job_saved_searches").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Edge Function: engine-crm-crud
// PATCH / DELETE a single CRM lead by ?id=UUID

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL       = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY  = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "PATCH, DELETE, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function verifyAuth(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  // Check cheap string comparison first before making a network call
  const token = auth.replace("Bearer ", "");
  if (token === SERVICE_ROLE_KEY) return true;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return false;
  return !!user;
}

const VALID_STAGES = ["new","contacted","follow_up","negotiation","closed_won","closed_lost"];
const VALID_OUTCOMES = ["no_answer","voicemail","callback","not_interested","interested","closed"];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const ok = await verifyAuth(req);
  if (!ok) return json({ error: "Unauthorized" }, 401);

  const url  = new URL(req.url);
  const id   = url.searchParams.get("id");
  const action = url.searchParams.get("action"); // "log_call" for adding call history
  const db   = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // ── POST ?action=log_call — add call history entry ──────────────
  if (req.method === "POST" && action === "log_call") {
    if (!id) return json({ error: "Missing ?id=" }, 400);
    const body = await req.json();
    const outcome = VALID_OUTCOMES.includes(body.outcome) ? body.outcome : null;
    const { data, error } = await db.from("crm_call_history").insert({
      lead_id:          id,
      called_at:        body.called_at ?? new Date().toISOString(),
      duration_seconds: typeof body.duration_seconds === "number" ? body.duration_seconds : null,
      outcome,
      notes:            typeof body.notes === "string" ? body.notes : null,
    }).select().single();
    if (error) throw error;
    // Update lead's last_called_at
    await db.from("crm_leads").update({
      last_called_at: body.called_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    return json({ success: true, entry: data });
  }

  if (!id) return json({ error: "Missing ?id=" }, 400);

  // ── PATCH — update lead fields ───────────────────────────────────
  if (req.method === "PATCH") {
    const body = await req.json();
    const allowed: Record<string, unknown> = {};
    if (body.name        !== undefined) allowed.name        = body.name;
    if (body.email       !== undefined) allowed.email       = body.email;
    if (body.phone       !== undefined) allowed.phone       = body.phone;
    if (body.company     !== undefined) allowed.company     = body.company;
    if (body.industry    !== undefined) allowed.industry    = body.industry;
    if (body.website     !== undefined) allowed.website     = body.website;
    if (body.notes       !== undefined) allowed.notes       = body.notes;
    if (body.tags        !== undefined && Array.isArray(body.tags)) allowed.tags = body.tags;
    if (body.next_task_at   !== undefined) allowed.next_task_at   = body.next_task_at;
    if (body.next_task_note !== undefined) allowed.next_task_note = body.next_task_note;
    if (body.pipeline_stage !== undefined && VALID_STAGES.includes(body.pipeline_stage)) {
      allowed.pipeline_stage = body.pipeline_stage;
    }
    if (Object.keys(allowed).length === 0) return json({ error: "No valid fields" }, 400);
    allowed.updated_at = new Date().toISOString();

    const { data, error } = await db.from("crm_leads").update(allowed).eq("id", id).select().single();
    if (error) throw error;
    return json({ success: true, lead: data });
  }

  // ── DELETE ───────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { error } = await db.from("crm_leads").delete().eq("id", id);
    if (error) throw error;
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, 405);
});

// ═══════════════════════════════════════════════════════════════════════════
// SmartLead edge function
// Dispatcher for SmartLead API operations.
//
// Actions:
//   • ping            → validates the API key (cheap GET)
//   • list_campaigns  → returns all campaigns (id, name, status, created_at)
//   • add_leads       → pushes leads to a campaign (default: env campaign id)
//
// Auth: same as other engine edge fns — Authorization: Bearer {SERVICE_ROLE_KEY}
// Env:
//   SMARTLEAD_API_KEY               (required)
//   SMARTLEAD_DEFAULT_CAMPAIGN_ID   (optional; overrides per-request if set)
//   SUPABASE_SERVICE_ROLE_KEY       (required for auth)
// ═══════════════════════════════════════════════════════════════════════════

// @ts-nocheck — Deno runtime; TS project skips this file

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SMARTLEAD_API_KEY             = Deno.env.get("SMARTLEAD_API_KEY") ?? "";
const SMARTLEAD_DEFAULT_CAMPAIGN_ID = Deno.env.get("SMARTLEAD_DEFAULT_CAMPAIGN_ID") ?? "";
const SERVICE_ROLE_KEY              = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SMARTLEAD_API_BASE = "https://server.smartlead.ai/api/v1";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── SmartLead API helper ────────────────────────────────────────────────────

/** Call the SmartLead REST API. Auth is via ?api_key query param. */
async function smartleadFetch(
  path: string,
  init: RequestInit = {},
  timeoutMs = 30_000,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  if (!SMARTLEAD_API_KEY) {
    throw new Error("SMARTLEAD_API_KEY not configured in Supabase secrets");
  }

  const sep = path.includes("?") ? "&" : "?";
  const url = `${SMARTLEAD_API_BASE}${path}${sep}api_key=${SMARTLEAD_API_KEY}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep as text */ }

  return { ok: res.ok, status: res.status, body };
}

// ── Action handlers ─────────────────────────────────────────────────────────

/** Ping: validate the API key works. SmartLead has no dedicated ping, so we
 *  hit /campaigns?limit=1 which is cheap and returns { ok:true } on success. */
async function handlePing() {
  const r = await smartleadFetch("/campaigns", { method: "GET" });
  if (!r.ok) {
    return json({
      success: false,
      error: `SmartLead auth failed (HTTP ${r.status})`,
      detail: r.body,
    }, 502);
  }
  return json({
    success: true,
    message: "SmartLead API key is valid",
    default_campaign_id: SMARTLEAD_DEFAULT_CAMPAIGN_ID || null,
  });
}

/** List all campaigns (for future UI picker). */
async function handleListCampaigns() {
  const r = await smartleadFetch("/campaigns", { method: "GET" });
  if (!r.ok) {
    return json({ success: false, error: "Failed to list campaigns", detail: r.body }, 502);
  }
  // SmartLead returns an array of campaigns; trim to useful fields.
  const raw = Array.isArray(r.body) ? r.body : [];
  const campaigns = raw.map((c: Record<string, unknown>) => ({
    id:         c.id,
    name:       c.name,
    status:     c.status,
    created_at: c.created_at,
    updated_at: c.updated_at,
    track_settings: c.track_settings,
  }));
  return json({ success: true, count: campaigns.length, campaigns });
}

// Lead shape we accept from the API route. Keep it loose — SmartLead ignores
// fields it doesn't recognize, so callers can send extra stuff safely.
interface LeadIn {
  first_name?: string | null;
  last_name?:  string | null;
  email:       string;
  phone_number?: string | null;
  company_name?: string | null;
  website?:    string | null;
  location?:   string | null;
  linkedin_profile?: string | null;
  company_url?: string | null;
  /** SmartLead custom fields — will show up in the campaign for templating. */
  custom_fields?: Record<string, string | number | null>;
}

/** Add leads to a campaign. */
async function handleAddLeads(body: {
  campaign_id?: string | number;
  leads: LeadIn[];
  settings?: Record<string, unknown>;
}) {
  const campaignId = body.campaign_id ?? SMARTLEAD_DEFAULT_CAMPAIGN_ID;
  if (!campaignId) {
    return json({ success: false, error: "campaign_id is required (or set SMARTLEAD_DEFAULT_CAMPAIGN_ID)" }, 400);
  }
  if (!Array.isArray(body.leads) || body.leads.length === 0) {
    return json({ success: false, error: "leads array is required and must not be empty" }, 400);
  }
  if (body.leads.length > 100) {
    return json({ success: false, error: "SmartLead accepts max 100 leads per request" }, 400);
  }

  // Reject leads without an email up-front (SmartLead requires it anyway).
  const missingEmail = body.leads.filter((l) => !l.email || !l.email.trim());
  if (missingEmail.length > 0) {
    return json({
      success: false,
      error: `${missingEmail.length} leads are missing email — SmartLead requires an email for every lead`,
    }, 400);
  }

  const payload = {
    lead_list: body.leads,
    settings: body.settings ?? {
      ignore_global_block_list:               false,
      ignore_unsubscribe_list:                false,
      ignore_community_bounce_list:           false,
      ignore_duplicate_leads_in_other_campaign: false,
    },
  };

  const r = await smartleadFetch(
    `/campaigns/${campaignId}/leads`,
    { method: "POST", body: JSON.stringify(payload) },
    60_000,
  );

  if (!r.ok) {
    return json({
      success: false,
      campaign_id: campaignId,
      error: `SmartLead add_leads failed (HTTP ${r.status})`,
      detail: r.body,
    }, 502);
  }

  // SmartLead returns { ok: true, upload_count, total_leads, already_added_to_campaign, invalid_emails_count, ... }
  const body2 = r.body as Record<string, unknown>;
  return json({
    success:     true,
    campaign_id: campaignId,
    uploaded:    body2.upload_count          ?? 0,
    duplicates:  body2.already_added_to_campaign ?? 0,
    invalid:     body2.invalid_emails_count  ?? 0,
    total_sent:  body.leads.length,
    detail:      body2,
  });
}

// ── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json({ error: "Unauthorized — invalid or missing Authorization header" }, 401);
  }

  let body: { action?: string; [k: string]: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  try {
    switch (body.action) {
      case "ping":
        return await handlePing();
      case "list_campaigns":
        return await handleListCampaigns();
      case "add_leads":
        return await handleAddLeads(body as Parameters<typeof handleAddLeads>[0]);
      default:
        return json({
          error: `Unknown action: ${body.action}`,
          valid_actions: ["ping", "list_campaigns", "add_leads"],
        }, 400);
    }
  } catch (err) {
    console.error("[smartleads] unhandled error:", err);
    return json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }, 500);
  }
});

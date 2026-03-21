import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const APIFY_API_KEY     = Deno.env.get("APIFY_API_KEY") ?? "";
// SERVICE_ROLE_KEY used only for the Supabase DB client below

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Detect source from URL
function detectSource(url: string): "youtube" | "instagram" | "tiktok" | "other" {
  if (/youtube\.com|youtu\.be/.test(url))   return "youtube";
  if (/instagram\.com/.test(url))           return "instagram";
  if (/tiktok\.com/.test(url))              return "tiktok";
  return "other";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!APIFY_API_KEY) return json({ error: "APIFY_API_KEY not configured" }, 500);

  let body: { url: string; save?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { url, save = true } = body;
  if (!url?.trim()) return json({ error: "url is required" }, 400);

  const source = detectSource(url);

  // ── 1. Run Apify actor ───────────────────────────────────────────
  // agentx/video-transcript handles YouTube, Instagram, TikTok + 1000+ platforms
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/agentx~video-transcript/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=120`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: url, url }),
    }
  );

  if (!runRes.ok) {
    const err = await runRes.text();
    return json({ error: `Apify error (${runRes.status}): ${err.slice(0, 300)}` }, 502);
  }

  const items: Record<string, unknown>[] = await runRes.json();

  if (!items || items.length === 0) {
    return json({ error: "No transcript returned from Apify — check the URL is public" }, 422);
  }

  const item = items[0];

  // Normalise fields across different actor output schemas
  const title   = String(item.title ?? item.videoTitle ?? item.name ?? item.video_title ?? "Untitled");
  const rawAuthor = item.author ?? item.channel ?? item.channelName ?? item.ownerUsername ?? item.username ?? item.uploader;
  const author  = rawAuthor ? String(rawAuthor) : null;
  // agentx/video-transcript returns transcript as an array of segments or a plain string
  let content: string;
  if (Array.isArray(item.transcript)) {
    content = (item.transcript as Array<{ text?: string; content?: string }>)
      .map((s) => s.text ?? s.content ?? "")
      .join(" ")
      .trim();
  } else {
    content = String(
      item.transcript ?? item.transcriptText ?? item.text ??
      item.captions ?? item.subtitles ?? item.fullText ?? ""
    ).trim();
  }

  if (!content) {
    return json({ error: "Apify returned data but transcript content was empty" }, 422);
  }

  // ── 2. Optionally save to Supabase ───────────────────────────────
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  if (save) {
    const { error: dbErr } = await db.from("engine_transcripts").insert({
      title,
      author,
      source,
      source_url: url,
      content,
    });

    if (dbErr) {
      return json({ error: `DB insert failed: ${dbErr.message}` }, 500);
    }
  }

  return json({ success: true, title, author, source, content });
});

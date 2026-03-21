import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const APIFY_API_KEY    = Deno.env.get("APIFY_API_KEY") ?? "";

// Hoist DB client — one instance per cold start, not per request
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

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

serve(async (req: Request) => {
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
  // agentx~video-transcript supports YouTube, Instagram, TikTok + 1000+ platforms
  let runRes: Response;
  try {
    runRes = await fetch(
      `https://api.apify.com/v2/acts/agentx~video-transcript/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=120`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: url }),
        signal: AbortSignal.timeout(130_000),
      }
    );
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    return json({ error: `Apify request failed: ${msg}` }, 502);
  }

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

  // agentx/video-transcript — try all known transcript field names
  let content = "";

  if (Array.isArray(item.transcript)) {
    content = (item.transcript as Array<{ text?: string; content?: string; transcript?: string }>)
      .map((s) => s.text ?? s.content ?? s.transcript ?? "")
      .join(" ")
      .trim();
  } else if (Array.isArray(item.captions)) {
    content = (item.captions as Array<{ text?: string }>)
      .map((s) => s.text ?? "")
      .join(" ")
      .trim();
  } else {
    content = String(
      item.transcript ?? item.transcriptText ?? item.fullTranscript ??
      item.text ?? item.captions ?? item.subtitles ?? item.fullText ??
      item.description ?? ""
    ).trim();
  }

  // Last resort — find the longest string value that looks like natural language (not a URL or ID)
  if (!content) {
    const longest = Object.values(item)
      .filter((v): v is string =>
        typeof v === "string" &&
        v.length > 100 &&
        !v.startsWith("http") &&
        !v.startsWith("www.")
      )
      .sort((a, b) => b.length - a.length)[0];
    if (longest) content = longest;
  }

  if (!content) {
    return json({
      error: "Transcript content was empty — the video may have no captions or the URL may be private",
    }, 422);
  }

  // ── 2. Optionally save to Supabase ───────────────────────────────
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

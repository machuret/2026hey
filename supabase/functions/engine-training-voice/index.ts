// Edge Function: engine-training-voice
// POST body: { messages: [{role, content}], prompt: string, voice?: string }
// Returns:   { reply: string, audio: string | null }
//
// Runs both OpenAI calls in parallel (chat + TTS-on-predicted-text) — NOT possible
// because we need the text before we can TTS it. Instead this function eliminates
// the Node.js Buffer dependency so it can run at the edge (lower cold-start,
// closer to the user, no Vercel 60s slot occupation).
//
// Base64 encoding uses the Web Streams / btoa approach — no Node APIs required.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const VALID_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);

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

/** Convert an ArrayBuffer to base64 without Node's Buffer — pure Web API */
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  // Process in 8KB chunks to avoid call-stack overflow on large audio files
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY not configured" }, 500);

  let body: { messages: { role: string; content: string }[]; prompt: string; voice?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { messages, prompt, voice = "alloy" } = body;

  if (!prompt)                  return json({ error: "prompt is required" }, 400);
  if (!Array.isArray(messages)) return json({ error: "messages must be array" }, 400);

  const safeVoice = VALID_VOICES.has(voice) ? voice : "alloy";

  const conversation = [
    { role: "system", content: prompt },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  // ── Step 1: Chat completion ──────────────────────────────────────────────
  let replyText = "";
  try {
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: conversation,
        max_tokens: 300,
        temperature: 0.85,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!chatRes.ok) {
      const err = await chatRes.text();
      console.error(`[training/voice] chat error (${chatRes.status}): ${err.slice(0, 200)}`);
      return json({ error: `OpenAI chat error: ${chatRes.status}` }, 502);
    }

    const chatData = await chatRes.json();
    replyText = (chatData.choices?.[0]?.message?.content ?? "").trim();
  } catch (e) {
    console.error("[training/voice] chat fetch failed:", String(e));
    return json({ error: "Chat request failed" }, 502);
  }

  if (!replyText) return json({ reply: "", audio: null });

  // ── Step 2: Text-to-speech ───────────────────────────────────────────────
  try {
    const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "tts-1",
        input: replyText,
        voice: safeVoice,
        response_format: "mp3",
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!ttsRes.ok) {
      const ttsErr = await ttsRes.text();
      console.error(`[training/voice] TTS failed (${ttsRes.status}): ${ttsErr.slice(0, 200)}`);
      return json({ reply: replyText, audio: null });
    }

    const audioBuf = await ttsRes.arrayBuffer();
    const audio    = arrayBufferToBase64(audioBuf);

    return json({ reply: replyText, audio });
  } catch (e) {
    console.error("[training/voice] TTS fetch failed:", String(e));
    // Return text without audio — conversation continues
    return json({ reply: replyText, audio: null });
  }
});

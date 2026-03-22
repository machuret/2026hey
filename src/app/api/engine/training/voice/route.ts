import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/engine/training/voice
// Body: { messages: [{role, content}], prompt: string, voice?: string }
// Returns: { reply: string } — text response from the AI prospect
export async function POST(req: NextRequest) {
  try {
    const { messages, prompt, voice = "alloy" } = await req.json();

    if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    if (!Array.isArray(messages)) return NextResponse.json({ error: "messages must be array" }, { status: 400 });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

    // Build the conversation for OpenAI Chat Completions
    const conversation = [
      { role: "system", content: prompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ];

    // 1. Get text reply from GPT-4o-mini (15s timeout — fail fast if OpenAI is slow)
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
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
      return NextResponse.json({ error: `OpenAI chat error: ${err.slice(0, 200)}` }, { status: 502 });
    }

    const chatData = await chatRes.json();
    const replyText: string = (chatData.choices?.[0]?.message?.content ?? "").trim();
    if (!replyText) return NextResponse.json({ reply: "", audio: null });

    // 2. Convert text to speech via OpenAI TTS
    const VALID_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    const safeVoice = VALID_VOICES.includes(voice) ? voice : "alloy";
    // 2. Convert text to speech (20s timeout — TTS is slower than chat)
    const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
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
      // Still return text so the conversation continues even without audio
      return NextResponse.json({ reply: replyText, audio: null });
    }

    // Stream audio as base64 so the browser can play it inline
    const audioBuffer = await ttsRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({ reply: replyText, audio: base64Audio });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

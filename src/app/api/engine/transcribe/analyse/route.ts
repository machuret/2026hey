import { NextRequest, NextResponse } from "next/server";
import { getEngineAdmin } from "@/lib/engineSupabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/engine/transcribe/analyse
// Body: { id: string } — analyse transcript with OpenAI, save analysis back to record
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

    const db = getEngineAdmin();

    // Fetch the transcript
    const { data: transcript, error: fetchErr } = await db
      .from("engine_transcripts")
      .select("title, author, content")
      .eq("id", id)
      .single();
    if (fetchErr || !transcript) return NextResponse.json({ error: "Transcript not found" }, { status: 404 });

    const systemPrompt = `You are an expert cold calling coach and sales trainer. 
Analyse this video transcript from a sales trainer and extract actionable training material.

Return a structured analysis with these sections:
1. **Key Techniques** — list the main sales/cold calling techniques demonstrated
2. **Objection Handling** — specific objections raised and how they were handled
3. **Opening Lines** — any strong opening lines or hooks used
4. **Closing Techniques** — closing strategies demonstrated
5. **Key Takeaways** — 3-5 bullet points a cold caller should immediately apply
6. **Suggested Training Prompt** — a ready-to-use system prompt for an AI role-play training session based on this content

Keep it concise, practical, and actionable for virtual assistants making cold calls.`;

    const userMessage = `Title: ${transcript.title}
Author: ${transcript.author ?? "Unknown"}

Transcript:
${transcript.content.slice(0, 12000)}`; // cap at ~12k chars to stay within token limits

    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userMessage },
        ],
        max_tokens: 1500,
        temperature: 0.4,
      }),
    });

    if (!chatRes.ok) {
      const err = await chatRes.text();
      return NextResponse.json({ error: `OpenAI error: ${err.slice(0, 200)}` }, { status: 502 });
    }

    const chatData = await chatRes.json();
    const analysis: string = (chatData.choices?.[0]?.message?.content ?? "").trim();
    if (!analysis) return NextResponse.json({ error: "OpenAI returned empty analysis" }, { status: 502 });

    // Save analysis back to the transcript record
    const { error: updateErr } = await db
      .from("engine_transcripts")
      .update({ analysis })
      .eq("id", id);
    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

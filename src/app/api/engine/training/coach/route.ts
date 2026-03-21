import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST /api/engine/training/coach
// Body: { messages: [{role, content}], scenarioName: string }
// Returns: { report: CoachingReport }

export type CoachingReport = {
  score: number;
  talkRatio: { you: number; prospect: number };
  fillerWords: { word: string; count: number }[];
  fillerTotal: number;
  objections: { objection: string; howHandled: string; rating: "good" | "ok" | "missed" }[];
  wentWell: string[];
  improve: string[];
  summary: string;
};

export async function POST(req: NextRequest) {
  try {
    const { messages, scenarioName } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

    // Count words per role for talk ratio
    const userWords = messages
      .filter((m: { role: string }) => m.role === "user")
      .reduce((acc: number, m: { content: string }) => acc + m.content.split(/\s+/).length, 0);
    const aiWords = messages
      .filter((m: { role: string }) => m.role === "assistant")
      .reduce((acc: number, m: { content: string }) => acc + m.content.split(/\s+/).length, 0);
    const total = userWords + aiWords || 1;
    const talkRatio = {
      you: Math.round((userWords / total) * 100),
      prospect: Math.round((aiWords / total) * 100),
    };

    // Count filler words in user messages
    const FILLERS = ["um", "uh", "like", "basically", "literally", "right", "you know", "kind of", "sort of", "actually"];
    const userText = messages
      .filter((m: { role: string }) => m.role === "user")
      .map((m: { content: string }) => m.content.toLowerCase())
      .join(" ");

    const fillerWords = FILLERS
      .map((w) => {
        const re = new RegExp(`\\b${w}\\b`, "gi");
        const count = (userText.match(re) ?? []).length;
        return { word: w, count };
      })
      .filter((f) => f.count > 0)
      .sort((a, b) => b.count - a.count);

    const fillerTotal = fillerWords.reduce((s, f) => s + f.count, 0);

    // Build transcript for GPT analysis
    const transcript = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "SALESPERSON" : "PROSPECT"}: ${m.content}`
      )
      .join("\n");

    const systemPrompt = `You are an expert cold calling coach analysing a roleplay session.
The scenario is: "${scenarioName || "Cold call"}".
You will receive a transcript and return a JSON coaching report.

Return ONLY valid JSON matching this exact structure:
{
  "score": <1-10 integer>,
  "objections": [
    {"objection": "...", "howHandled": "...", "rating": "good"|"ok"|"missed"}
  ],
  "wentWell": ["...", "...", "..."],
  "improve": ["...", "...", "..."],
  "summary": "One sentence overall assessment"
}

Scoring guide:
- 9-10: Excellent — handled objections confidently, clear value prop, natural flow
- 7-8: Good — solid technique with minor gaps
- 5-6: Average — some good moments but missed key opportunities
- 3-4: Needs work — major technique issues
- 1-2: Very poor — fundamental problems

Be specific and actionable. Reference actual lines from the transcript.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `TRANSCRIPT:\n${transcript}` },
        ],
        max_tokens: 800,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `OpenAI error: ${err.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    const report: CoachingReport = {
      score: parsed.score ?? 5,
      talkRatio,
      fillerWords,
      fillerTotal,
      objections: parsed.objections ?? [],
      wentWell: parsed.wentWell ?? [],
      improve: parsed.improve ?? [],
      summary: parsed.summary ?? "",
    };

    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Edge Function: engine-leads-qualify
// Scores a batch of leads using OpenAI GPT-4o-mini (+ optional Anthropic Claude)
// Returns leads sorted by score desc with structured reasoning

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY          = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const OPENAI_API_KEY    = Deno.env.get("OPENAI_API_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

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

function verifyAuth(req: Request): boolean {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  return token === SERVICE_ROLE_KEY || token === ANON_KEY;
}

type Lead = {
  name: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  [key: string]: unknown;
};

type ScoreResult = {
  ai_score: number;
  ai_score_reason: string;
  ai_signals: string[];
  call_opener: string;
};

type ScoredLead = Lead & ScoreResult;

const DEFAULT_SCORING_PROMPT = `You are a B2B sales qualification expert for a virtual assistant cold-calling agency.
Score each lead 1-10 based on how likely they are to need and afford a virtual assistant service.

Scoring criteria:
- 8-10: Clear SMB with phone, email, real website — ideal target
- 5-7:  Partial data or unclear fit — worth a call but uncertain
- 1-4:  Franchise/chain location, missing contact info, or consumer-facing — skip

Also generate:
- signals: array of short flags like "has_phone", "has_email", "has_website", "SMB_fit", "franchise_risk", "missing_contact"
- call_opener: one punchy sentence to open the cold call referencing their specific business`;

/** Score a single lead with OpenAI */
async function scoreWithOpenAI(lead: Lead, scoringPrompt: string): Promise<ScoreResult> {
  const userMsg = `Score this lead:
Company: ${lead.company || lead.name || "Unknown"}
Industry: ${lead.industry || "Unknown"}
Phone: ${lead.phone ? "✓" : "✗"}
Email: ${lead.email ? "✓" : "✗"}
Website: ${lead.website || "none"}

Respond with ONLY valid JSON (no markdown):
{"score": 7, "reason": "...", "signals": ["has_phone","SMB_fit"], "call_opener": "..."}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: scoringPrompt },
        { role: "user",   content: userMsg },
      ],
      max_tokens: 200,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");

  return {
    ai_score:        Math.min(10, Math.max(1, Number(parsed.score) || 5)),
    ai_score_reason: String(parsed.reason ?? ""),
    ai_signals:      Array.isArray(parsed.signals) ? parsed.signals.map(String) : [],
    call_opener:     String(parsed.call_opener ?? ""),
  };
}

/** Score a single lead with Anthropic Claude Haiku */
async function scoreWithClaude(lead: Lead, scoringPrompt: string): Promise<ScoreResult> {
  const userMsg = `Score this lead and respond with ONLY valid JSON (no markdown, no explanation):
Company: ${lead.company || lead.name || "Unknown"}
Industry: ${lead.industry || "Unknown"}
Phone: ${lead.phone ? "✓" : "✗"}
Email: ${lead.email ? "✓" : "✗"}
Website: ${lead.website || "none"}

JSON format: {"score": 7, "reason": "...", "signals": ["has_phone","SMB_fit"], "call_opener": "..."}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-20240307",
      max_tokens: 200,
      system: scoringPrompt,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
  const data = await res.json();
  const text  = data.content?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text);

  return {
    ai_score:        Math.min(10, Math.max(1, Number(parsed.score) || 5)),
    ai_score_reason: String(parsed.reason ?? ""),
    ai_signals:      Array.isArray(parsed.signals) ? parsed.signals.map(String) : [],
    call_opener:     String(parsed.call_opener ?? ""),
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!verifyAuth(req)) return json({ error: "Unauthorized" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY not configured" }, 500);

  let body: { leads: Lead[]; scoringPrompt?: string; useClaudeForBorderline?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { leads, scoringPrompt = DEFAULT_SCORING_PROMPT, useClaudeForBorderline = false } = body;

  if (!Array.isArray(leads) || leads.length === 0) {
    return json({ error: "leads array is required" }, 400);
  }
  if (leads.length > 100) {
    return json({ error: "Maximum 100 leads per qualify batch" }, 400);
  }

  const scored: ScoredLead[] = [];
  const errors: string[] = [];

  // Score all leads — batch with concurrency limit of 5
  const CONCURRENCY = 5;
  for (let i = 0; i < leads.length; i += CONCURRENCY) {
    const batch = leads.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (lead) => {
        try {
          const result = await scoreWithOpenAI(lead, scoringPrompt);

          // If borderline (4-6) and Claude is available + enabled, re-score with Claude
          if (useClaudeForBorderline && ANTHROPIC_API_KEY && result.ai_score >= 4 && result.ai_score <= 6) {
            try {
              const claudeResult = await scoreWithClaude(lead, scoringPrompt);
              // Average the two scores for borderline cases
              return {
                ...lead,
                ...claudeResult,
                ai_score: Math.round((result.ai_score + claudeResult.ai_score) / 2),
                ai_score_reason: `OpenAI: ${result.ai_score_reason} | Claude: ${claudeResult.ai_score_reason}`,
              } as ScoredLead;
            } catch { /* fall back to OpenAI result */ }
          }

          return { ...lead, ...result } as ScoredLead;
        } catch (err) {
          errors.push(`${lead.company || lead.name}: ${String(err)}`);
          // Return lead with neutral score on error
          return {
            ...lead,
            ai_score: 5,
            ai_score_reason: "Scoring failed — manual review needed",
            ai_signals: [],
            call_opener: "",
          } as ScoredLead;
        }
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") scored.push(r.value);
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.ai_score - a.ai_score);

  return json({ success: true, leads: scored, errors, totalScored: scored.length });
});

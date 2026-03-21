"use client";

import { useState } from "react";
import { Loader2, Brain, ArrowRight, Sparkles, SlidersHorizontal } from "lucide-react";
import { ScrapedLead, scoreColour } from "@/app/engine/leads/types";
import { LeadsTable } from "./LeadsTable";
import { ErrBanner } from "./ErrBanner";

type Props = {
  leads: ScrapedLead[];
  selected: Set<number>;
  qualifying: boolean;
  error: string;
  scoreThreshold: number;
  useClaudeForBorderline: boolean;
  scoringPrompt: string;
  onQualify: (prompt: string, useClaude: boolean) => void;
  onSkip: () => void;
  onThresholdChange: (n: number) => void;
  onToggle: (i: number) => void;
};

export function QualifyTab({
  leads, selected, qualifying, error,
  scoreThreshold, useClaudeForBorderline, scoringPrompt,
  onQualify, onSkip, onThresholdChange, onToggle,
}: Props) {
  const [localPrompt,     setLocalPrompt]     = useState(scoringPrompt);
  const [localUseClaude,  setLocalUseClaude]  = useState(useClaudeForBorderline);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  const qualifiedLeads = leads.filter((l) => l.ai_score !== undefined);
  const aboveThreshold = leads.filter((l) => (l.ai_score ?? 0) >= scoreThreshold);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">AI Lead Scoring</h2>
          <p className="text-xs text-gray-500">
            GPT-4o-mini scores each lead 1–10 with reasoning, signals, and a personalised cold-call opener.
            Optionally use Claude Haiku for borderline leads (score 4–6) for a second opinion.
          </p>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No leads yet — run Scrape first</p>
          </div>
        ) : (
          <>
            {/* Score threshold slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Min score threshold
                </label>
                <span className={`text-sm font-bold ${scoreColour(scoreThreshold)}`}>{scoreThreshold}/10</span>
              </div>
              <input
                type="range" min={1} max={10}
                value={scoreThreshold}
                onChange={(e) => onThresholdChange(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              {qualifiedLeads.length > 0 && (
                <p className="text-[10px] text-gray-500">
                  {aboveThreshold.length} of {qualifiedLeads.length} leads score ≥ {scoreThreshold}
                </p>
              )}
            </div>

            {/* Claude toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                onClick={() => setLocalUseClaude((v) => !v)}
                className={`w-9 h-5 rounded-full transition-colors relative ${localUseClaude ? "bg-indigo-600" : "bg-gray-700"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${localUseClaude ? "left-4" : "left-0.5"}`} />
              </button>
              <span className="text-xs text-gray-400">
                Use Claude Haiku for borderline scores (4–6) — better nuanced reasoning
              </span>
            </label>

            {/* Custom prompt toggle */}
            <div>
              <button
                onClick={() => setShowPromptEditor((v) => !v)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                {showPromptEditor ? "Hide" : "Customise"} scoring prompt
              </button>
              {showPromptEditor && (
                <textarea
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  placeholder="Leave blank to use the default cold-calling agency prompt…"
                  rows={5}
                  className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              )}
            </div>

            <ErrBanner msg={error} />

            <div className="flex gap-3">
              <button
                onClick={() => onQualify(localPrompt, localUseClaude)}
                disabled={qualifying}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {qualifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {qualifying ? `Scoring ${leads.length} leads…` : "Score Leads with AI"}
                {!qualifying && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
              </button>
              <button
                onClick={onSkip}
                className="flex items-center gap-2 rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
              >
                Skip <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Score distribution chart */}
      {qualifiedLeads.length > 0 && (
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Score Distribution</h3>
          <div className="flex items-end gap-1 h-12">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => {
              const count = qualifiedLeads.filter((l) => l.ai_score === s).length;
              const pct   = (count / qualifiedLeads.length) * 100;
              return (
                <div key={s} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t opacity-70 ${s >= 8 ? "bg-emerald-500" : s >= 5 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ height: `${Math.max(pct, 2)}%`, minHeight: count > 0 ? "4px" : "0" }}
                  />
                  <span className="text-[9px] text-gray-600">{s}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {leads.length > 0 && <LeadsTable rows={leads} selected={selected} onToggle={onToggle} showScore />}
    </div>
  );
}

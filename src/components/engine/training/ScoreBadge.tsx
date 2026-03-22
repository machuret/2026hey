"use client";

import { Star } from "lucide-react";

export function ScoreBadge({ score }: { score: number }) {
  const colour =
    score >= 8 ? "text-emerald-400 border-emerald-700 bg-emerald-900/30"
    : score >= 6 ? "text-amber-400 border-amber-700 bg-amber-900/30"
    : "text-red-400 border-red-700 bg-red-900/30";
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${colour}`}>
      <Star className="h-4 w-4 fill-current" />
      <span className="text-xl font-bold">{score}</span>
      <span className="text-xs opacity-70">/10</span>
    </div>
  );
}

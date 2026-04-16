"use client";

import { Star, User, Linkedin, Mail, CheckCircle } from "lucide-react";
import type { JobLead } from "../types";

type Props = { job: JobLead };

export default function EnrichmentBadge({ job }: Props) {
  const hasAI = job.ai_enriched_at != null;
  const hasDM = !!job.dm_name;
  const hasEmail = !!job.dm_email;
  const hasLI = job.li_enriched_at != null;
  const isComplete = hasDM && hasEmail;

  if (!hasAI && !hasDM && !hasLI) {
    return <span className="text-xs text-gray-600">Not enriched</span>;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Complete indicator */}
      {isComplete && (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-800/50">
          <CheckCircle className="h-3 w-3" />
          Ready
        </span>
      )}

      {/* AI score */}
      {job.ai_relevance_score != null && (
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium border ${
            job.ai_relevance_score >= 7
              ? "bg-emerald-900/30 text-emerald-300 border-emerald-800/50"
              : job.ai_relevance_score >= 4
                ? "bg-yellow-900/30 text-yellow-300 border-yellow-800/50"
                : "bg-red-900/30 text-red-300 border-red-800/50"
          }`}
        >
          <Star className="h-3 w-3" />
          {job.ai_relevance_score}/10
        </span>
      )}

      {/* DM found */}
      {hasDM && (
        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium border ${
          hasEmail
            ? "bg-emerald-900/30 text-emerald-300 border-emerald-800/50"
            : "bg-blue-900/30 text-blue-300 border-blue-800/50"
        }`}>
          <User className="h-3 w-3" />
          {job.dm_name}
          {hasEmail && <Mail className="h-3 w-3" />}
        </span>
      )}

      {/* LinkedIn enriched */}
      {hasLI && (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-indigo-900/30 text-indigo-300 border border-indigo-800/50">
          <Linkedin className="h-3 w-3" />
          LI
        </span>
      )}
    </div>
  );
}

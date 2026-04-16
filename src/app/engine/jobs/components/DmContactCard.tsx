"use client";

import { User, Mail, Phone, Linkedin, Building2, Brain } from "lucide-react";
import type { JobLead } from "../types";

type Props = { job: JobLead };

export default function DmContactCard({ job }: Props) {
  const hasAI = !!job.ai_enriched_at;
  const hasDM = !!job.dm_enriched_at;
  const hasLI = !!job.li_enriched_at;

  return (
    <div className="space-y-4">
      {/* AI Analysis */}
      {hasAI && (
        <div className="rounded-lg border border-blue-800/50 bg-blue-950/20 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-300 mb-2">
            <Brain className="h-4 w-4" /> AI Analysis
          </h4>
          {job.ai_company_summary && (
            <p className="text-sm text-gray-300 mb-2">{job.ai_company_summary}</p>
          )}
          {job.ai_hiring_signal && (
            <p className="text-xs text-gray-400 mb-2">
              <span className="text-yellow-400 font-medium">Hiring Signal:</span> {job.ai_hiring_signal}
            </p>
          )}
          {job.ai_relevance_score != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Relevance:</span>
              <span className={`text-sm font-bold ${
                job.ai_relevance_score >= 7 ? "text-emerald-400" :
                job.ai_relevance_score >= 4 ? "text-yellow-400" : "text-red-400"
              }`}>
                {job.ai_relevance_score}/10
              </span>
              {job.ai_relevance_reason && (
                <span className="text-xs text-gray-500">— {job.ai_relevance_reason}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Decision Maker */}
      {hasDM && (
        <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-3">
            <User className="h-4 w-4" /> Decision Maker
          </h4>
          {job.dm_name && (() => {
            const parts = job.dm_name.trim().split(/\s+/);
            const firstName = parts[0] ?? "";
            const lastName = parts.slice(1).join(" ") ?? "";
            return (
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">First Name</span>
                  <span className="text-sm font-medium text-white">{firstName}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Last Name</span>
                  <span className="text-sm font-medium text-white">{lastName || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Full Name</span>
                  <span className="text-sm font-medium text-white">{job.dm_name}</span>
                </div>
              </div>
            );
          })()}
          {job.dm_title && (
            <p className="text-xs text-gray-400 mb-2">{job.dm_title}</p>
          )}
          <div className="flex flex-col gap-1 mt-2">
            {job.dm_email && (
              <a href={`mailto:${job.dm_email}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                <Mail className="h-3.5 w-3.5" /> {job.dm_email}
              </a>
            )}
            {(job.dm_phone || job.dm_mobile) && (
              <a href={`tel:${job.dm_mobile || job.dm_phone}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                <Phone className="h-3.5 w-3.5" /> {job.dm_mobile || job.dm_phone}
              </a>
            )}
            {job.dm_linkedin_url && (
              <a href={job.dm_linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn Profile
              </a>
            )}
          </div>
        </div>
      )}

      {/* LinkedIn Company Intel */}
      {hasLI && (
        <div className="rounded-lg border border-indigo-800/50 bg-indigo-950/20 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-indigo-300 mb-2">
            <Building2 className="h-4 w-4" /> LinkedIn Company Intel
          </h4>
          {job.li_company_desc && (
            <p className="text-sm text-gray-300 mb-2">{job.li_company_desc}</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            {job.li_company_size && <div><span className="text-gray-500">Size:</span> {job.li_company_size}</div>}
            {job.li_industry && <div><span className="text-gray-500">Industry:</span> {job.li_industry}</div>}
            {job.li_hq_location && <div><span className="text-gray-500">HQ:</span> {job.li_hq_location}</div>}
            {job.li_company_url && (
              <a href={job.li_company_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                View on LinkedIn
              </a>
            )}
          </div>
        </div>
      )}

      {/* Listing contacts */}
      {(job.emails.length > 0 || job.phone_numbers.length > 0 || job.recruiter_name) && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">From Job Listing</h4>
          {job.recruiter_name && (
            <p className="text-xs text-gray-400">Recruiter: {job.recruiter_name} {job.recruiter_agency ? `(${job.recruiter_agency})` : ""}</p>
          )}
          {job.emails.map((e) => (
            <a key={e} href={`mailto:${e}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
              <Mail className="h-3.5 w-3.5" /> {e}
            </a>
          ))}
          {job.phone_numbers.map((p) => (
            <a key={p} href={`tel:${p}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
              <Phone className="h-3.5 w-3.5" /> {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

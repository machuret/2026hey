"use client";

import {
  Brain, AlertTriangle, Briefcase, Target, Clock,
  Building2, DollarSign, Mail, Copy, CheckCircle,
} from "lucide-react";
import { useState } from "react";
import type { JobLead } from "../types";

type Props = { job: JobLead };

export default function AIClassificationCard({ job }: Props) {
  const [copied, setCopied] = useState(false);

  if (!job.ai_enriched_at) return null;

  const isAgency = job.ai_poster_type === "agency_recruiter";

  const copySnippet = () => {
    if (job.ai_email_snippet) {
      navigator.clipboard.writeText(job.ai_email_snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Brain className="h-4 w-4 text-blue-400" />
        AI Classification
      </h3>

      {/* Poster type */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border ${
            isAgency
              ? "bg-orange-900/30 text-orange-400 border-orange-800/50"
              : "bg-emerald-900/30 text-emerald-300 border-emerald-800/50"
          }`}
        >
          {isAgency ? <AlertTriangle className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
          {isAgency ? "Agency Recruiter" : "Direct Employer"}
        </span>
        {job.ai_poster_reason && (
          <span className="text-xs text-gray-500">{job.ai_poster_reason}</span>
        )}
      </div>

      {/* Score + Summary */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {job.ai_relevance_score != null && (
          <div>
            <span className="text-gray-500">Relevance:</span>{" "}
            <span className={
              job.ai_relevance_score >= 7 ? "text-emerald-400" :
              job.ai_relevance_score >= 4 ? "text-yellow-400" : "text-red-400"
            }>
              {job.ai_relevance_score}/10
            </span>
            {job.ai_relevance_reason && (
              <span className="text-gray-500 ml-1">— {job.ai_relevance_reason}</span>
            )}
          </div>
        )}
        {job.ai_company_summary && (
          <div className="col-span-2">
            <span className="text-gray-500">Company:</span>{" "}
            <span className="text-gray-300">{job.ai_company_summary}</span>
          </div>
        )}
      </div>

      {/* Role Analysis */}
      <div className="rounded-lg bg-gray-900/50 border border-gray-800 p-3 space-y-2">
        <h4 className="text-xs font-medium text-gray-400 flex items-center gap-1">
          <Briefcase className="h-3 w-3" /> Role Analysis
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {job.ai_role_seniority && (
            <div><span className="text-gray-500">Seniority:</span> <span className="text-gray-300">{job.ai_role_seniority}</span></div>
          )}
          {job.ai_role_function && (
            <div><span className="text-gray-500">Function:</span> <span className="text-gray-300">{job.ai_role_function}</span></div>
          )}
          {job.ai_employment_type && (
            <div><span className="text-gray-500">Type:</span> <span className="text-gray-300">{job.ai_employment_type}</span></div>
          )}
          {job.ai_required_experience && (
            <div><span className="text-gray-500">Experience:</span> <span className="text-gray-300">{job.ai_required_experience}</span></div>
          )}
          {job.ai_reports_to && (
            <div><span className="text-gray-500">Reports to:</span> <span className="text-gray-300">{job.ai_reports_to}</span></div>
          )}
          {job.ai_work_model && (
            <div><span className="text-gray-500">Work model:</span> <span className="text-gray-300">{job.ai_work_model}</span></div>
          )}
        </div>

        {/* Skills tags */}
        {job.ai_required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {job.ai_required_skills.map((skill) => (
              <span key={skill} className="inline-block rounded px-1.5 py-0.5 text-xs bg-blue-900/30 text-blue-300 border border-blue-800/40">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Certifications */}
        {job.ai_required_certifications.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {job.ai_required_certifications.map((cert) => (
              <span key={cert} className="inline-block rounded px-1.5 py-0.5 text-xs bg-purple-900/30 text-purple-300 border border-purple-800/40">
                {cert}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hiring Intelligence */}
      <div className="rounded-lg bg-gray-900/50 border border-gray-800 p-3 space-y-2">
        <h4 className="text-xs font-medium text-gray-400 flex items-center gap-1">
          <Target className="h-3 w-3" /> Hiring Intelligence
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {job.ai_urgency && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-gray-500">Urgency:</span>{" "}
              <span className={
                job.ai_urgency === "Immediate" || job.ai_urgency === "High"
                  ? "text-red-400 font-medium" : "text-gray-300"
              }>{job.ai_urgency}</span>
            </div>
          )}
          {job.ai_industry_vertical && (
            <div><span className="text-gray-500">Vertical:</span> <span className="text-gray-300">{job.ai_industry_vertical}</span></div>
          )}
          {job.ai_team_size_clue && (
            <div><span className="text-gray-500">Team size:</span> <span className="text-gray-300">{job.ai_team_size_clue}</span></div>
          )}
          {job.ai_suggested_dm_title && (
            <div><span className="text-gray-500">Target DM:</span> <span className="text-gray-300">{job.ai_suggested_dm_title}</span></div>
          )}
        </div>
        {job.ai_urgency_clues && (
          <p className="text-xs text-gray-400">{job.ai_urgency_clues}</p>
        )}
        {job.ai_hiring_signal && (
          <p className="text-xs text-gray-400"><span className="text-gray-500">Hiring signal:</span> {job.ai_hiring_signal}</p>
        )}
        {job.ai_company_pain_points && (
          <p className="text-xs text-gray-400"><span className="text-gray-500">Pain points:</span> {job.ai_company_pain_points}</p>
        )}
      </div>

      {/* Compensation */}
      {(job.ai_salary_normalized || job.ai_benefits_summary) && (
        <div className="rounded-lg bg-gray-900/50 border border-gray-800 p-3 space-y-1">
          <h4 className="text-xs font-medium text-gray-400 flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Compensation
          </h4>
          <div className="text-xs text-gray-300">
            {job.ai_salary_normalized && <p><span className="text-gray-500">Salary:</span> {job.ai_salary_normalized}</p>}
            {job.ai_benefits_summary && <p><span className="text-gray-500">Benefits:</span> {job.ai_benefits_summary}</p>}
          </div>
        </div>
      )}

      {/* Candidate Persona */}
      {job.ai_candidate_persona && (
        <div className="rounded-lg bg-gray-900/50 border border-gray-800 p-3">
          <h4 className="text-xs font-medium text-gray-400 mb-1">Ideal Candidate</h4>
          <p className="text-xs text-gray-300">{job.ai_candidate_persona}</p>
        </div>
      )}

      {/* Cold Email Building Blocks */}
      <div className="rounded-lg bg-indigo-950/30 border border-indigo-800/40 p-3 space-y-2">
        <h4 className="text-xs font-medium text-indigo-300 flex items-center gap-1">
          <Mail className="h-3 w-3" /> Cold Email Kit
        </h4>
        {job.ai_pitch_angle && (
          <p className="text-xs text-gray-300"><span className="text-gray-500">Pitch:</span> {job.ai_pitch_angle}</p>
        )}
        {job.ai_email_snippet && (
          <div className="relative">
            <p className="text-xs text-gray-200 bg-gray-900/60 rounded p-2 pr-8 leading-relaxed">
              {job.ai_email_snippet}
            </p>
            <button
              onClick={copySnippet}
              className="absolute top-1.5 right-1.5 p-1 rounded text-gray-500 hover:text-white transition-colors"
              title="Copy email snippet"
            >
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
        {job.ai_objection_preempt && (
          <p className="text-xs text-gray-400"><span className="text-gray-500">Objection:</span> {job.ai_objection_preempt}</p>
        )}
      </div>
    </div>
  );
}

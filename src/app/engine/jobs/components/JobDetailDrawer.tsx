"use client";

import { useEffect } from "react";
import { X, ExternalLink, MapPin, Briefcase, Calendar, DollarSign } from "lucide-react";
import type { JobLead } from "../types";
import { STATUS_COLOURS, STATUS_LABELS } from "../types";
import DmContactCard from "./DmContactCard";

type Props = {
  job: JobLead | null;
  onClose: () => void;
};

export default function JobDetailDrawer({ job, onClose }: Props) {
  // Close on Escape key
  useEffect(() => {
    if (!job) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [job, onClose]);

  if (!job) return null;

  const statusClass = STATUS_COLOURS[job.status] ?? "bg-gray-800 text-gray-300";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-gray-950 border-l border-gray-800 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              {job.company_name || "Unknown Company"}
            </h2>
            <p className="text-sm text-gray-400 truncate">{job.job_title}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium border ${statusClass}`}>
              {STATUS_LABELS[job.status]}
            </span>
            <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 capitalize">
              {job.source}
            </span>
            {job.country && (
              <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                {job.country}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {job.location && (
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="h-4 w-4 text-gray-600" /> {job.location}
              </div>
            )}
            {job.work_type && (
              <div className="flex items-center gap-2 text-gray-400">
                <Briefcase className="h-4 w-4 text-gray-600" /> {job.work_type}
              </div>
            )}
            {job.salary && (
              <div className="flex items-center gap-2 text-gray-400">
                <DollarSign className="h-4 w-4 text-gray-600" /> {job.salary}
              </div>
            )}
            {job.listed_at && (
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="h-4 w-4 text-gray-600" /> {job.listed_at}
              </div>
            )}
          </div>

          {job.job_url && (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="h-4 w-4" /> View original listing
            </a>
          )}

          {/* Enrichment data */}
          <DmContactCard job={job} />

          {/* Full description */}
          {job.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Job Description</h3>
              <div className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {job.description}
              </div>
            </div>
          )}

          {/* Company info from listing */}
          {(job.company_website || job.company_industry || job.company_size) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Company Info (from listing)</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                {job.company_website && (
                  <a href={job.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    {job.company_website}
                  </a>
                )}
                {job.company_industry && <div><span className="text-gray-500">Industry:</span> {job.company_industry}</div>}
                {job.company_size && <div><span className="text-gray-500">Size:</span> {job.company_size}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

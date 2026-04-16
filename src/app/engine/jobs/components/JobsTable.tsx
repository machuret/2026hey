"use client";

import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { JobLead } from "../types";
import { STATUS_COLOURS, STATUS_LABELS } from "../types";
import EnrichmentBadge from "./EnrichmentBadge";

type Props = {
  jobs: JobLead[];
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (jobs: JobLead[]) => void;
  onViewDetail: (job: JobLead) => void;
};

export default function JobsTable({ jobs, selected, toggle, toggleAll, onViewDetail }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No jobs yet. Run a scrape to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs text-gray-400 uppercase tracking-wider">
            <th className="py-3 px-2 w-8">
              <input
                type="checkbox"
                checked={selected.size === jobs.length && jobs.length > 0}
                onChange={() => toggleAll(jobs)}
                className="rounded bg-gray-800 border-gray-600"
              />
            </th>
            <th className="py-3 px-2">Company</th>
            <th className="py-3 px-2">Job Title</th>
            <th className="py-3 px-2">Location</th>
            <th className="py-3 px-2">Source</th>
            <th className="py-3 px-2">Enrichment</th>
            <th className="py-3 px-2">Status</th>
            <th className="py-3 px-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <TableRow
              key={job.id}
              job={job}
              isSelected={selected.has(job.id)}
              isExpanded={expandedId === job.id}
              onToggle={() => toggle(job.id)}
              onExpand={() => setExpandedId(expandedId === job.id ? null : job.id)}
              onViewDetail={() => onViewDetail(job)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({
  job, isSelected, isExpanded, onToggle, onExpand, onViewDetail,
}: {
  job: JobLead;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onViewDetail: () => void;
}) {
  const statusClass = STATUS_COLOURS[job.status] ?? "bg-gray-800 text-gray-300";

  return (
    <>
      <tr
        className={`border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors ${
          isSelected ? "bg-indigo-950/20" : ""
        }`}
      >
        <td className="py-2.5 px-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="rounded bg-gray-800 border-gray-600"
          />
        </td>
        <td className="py-2.5 px-2" onClick={onViewDetail}>
          <div className="font-medium text-white truncate max-w-[200px]">
            {job.company_name || "Unknown Company"}
          </div>
          {job.salary && (
            <div className="text-xs text-gray-500 truncate">{job.salary}</div>
          )}
        </td>
        <td className="py-2.5 px-2" onClick={onViewDetail}>
          <div className="text-gray-300 truncate max-w-[250px]">{job.job_title}</div>
          {job.job_url && (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" /> View listing
            </a>
          )}
        </td>
        <td className="py-2.5 px-2 text-gray-400" onClick={onViewDetail}>
          <div className="truncate max-w-[120px]">{job.location || "—"}</div>
          {job.country && (
            <span className="text-xs text-gray-600">{job.country}</span>
          )}
        </td>
        <td className="py-2.5 px-2">
          <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 capitalize">
            {job.source}
          </span>
        </td>
        <td className="py-2.5 px-2">
          <EnrichmentBadge job={job} />
        </td>
        <td className="py-2.5 px-2">
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium border ${statusClass}`}>
            {STATUS_LABELS[job.status]}
          </span>
        </td>
        <td className="py-2.5 px-2">
          <button onClick={onExpand} className="p-1 text-gray-500 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
      </tr>

      {/* Expanded description row */}
      {isExpanded && (
        <tr className="border-b border-gray-800/50">
          <td colSpan={8} className="px-4 py-3 bg-gray-900/50">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-2">
              {job.work_type && <div><span className="text-gray-500">Type:</span> {job.work_type}</div>}
              {job.work_arrangement && <div><span className="text-gray-500">Arrangement:</span> {job.work_arrangement}</div>}
              {job.recruiter_name && <div><span className="text-gray-500">Recruiter:</span> {job.recruiter_name}{job.recruiter_agency ? ` (${job.recruiter_agency})` : ""}</div>}
              {job.emails.length > 0 && <div><span className="text-gray-500">Emails:</span> {job.emails.join(", ")}</div>}
              {job.phone_numbers.length > 0 && <div><span className="text-gray-500">Phones:</span> {job.phone_numbers.join(", ")}</div>}
              {job.dm_name && (() => {
                const parts = job.dm_name.trim().split(/\s+/);
                const first = parts[0] ?? "";
                const last = parts.slice(1).join(" ");
                return (
                  <div className="col-span-2 flex gap-4">
                    <span><span className="text-gray-500">First:</span> {first}</span>
                    {last && <span><span className="text-gray-500">Last:</span> {last}</span>}
                    <span><span className="text-gray-500">Full:</span> {job.dm_name}</span>
                    {job.dm_email && <span><span className="text-gray-500">Email:</span> {job.dm_email}</span>}
                    {job.dm_title && <span><span className="text-gray-500">Title:</span> {job.dm_title}</span>}
                  </div>
                );
              })()}
            </div>
            {job.description && (
              <div className="text-xs text-gray-400 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {job.description.slice(0, 1000)}
                {job.description.length > 1000 && "…"}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

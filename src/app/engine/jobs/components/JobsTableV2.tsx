"use client";

// ═══════════════════════════════════════════════════════════════════════════
// JobsTableV2 — stage-aware table. Pass `columns` config from tableColumns.tsx
// ═══════════════════════════════════════════════════════════════════════════

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { JobLead } from "../types";
import type { TableColumn } from "../tableColumns";
import { splitDmName } from "../utils";

type Props = {
  jobs: JobLead[];
  columns: TableColumn[];
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (jobs: JobLead[]) => void;
  onViewDetail: (job: JobLead) => void;
  emptyMessage?: string;
  /** Optional per-row action buttons (e.g. "Find DM", "Push") */
  rowActions?: (job: JobLead) => React.ReactNode;
};

export default function JobsTableV2({
  jobs, columns, selected, toggle, toggleAll, onViewDetail,
  emptyMessage = "No jobs in this stage.",
  rowActions,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        {emptyMessage}
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
            {columns.map((col) => (
              <th key={col.key} className="py-3 px-2" style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
            {rowActions && <th className="py-3 px-2">Actions</th>}
            <th className="py-3 px-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <TableRow
              key={job.id}
              job={job}
              columns={columns}
              isSelected={selected.has(job.id)}
              isExpanded={expandedId === job.id}
              onToggle={() => toggle(job.id)}
              onExpand={() => setExpandedId(expandedId === job.id ? null : job.id)}
              onViewDetail={() => onViewDetail(job)}
              rowActions={rowActions}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({
  job, columns, isSelected, isExpanded, onToggle, onExpand, onViewDetail, rowActions,
}: {
  job: JobLead;
  columns: TableColumn[];
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onViewDetail: () => void;
  rowActions?: (job: JobLead) => React.ReactNode;
}) {
  const colSpan = columns.length + (rowActions ? 3 : 2);
  return (
    <>
      <tr
        className={`border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors ${
          isSelected ? "bg-indigo-950/20" : ""
        }`}
      >
        <td className="py-2.5 px-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="rounded bg-gray-800 border-gray-600"
          />
        </td>
        {columns.map((col) => (
          <td key={col.key} className="py-2.5 px-2" onClick={onViewDetail}>
            {col.render(job)}
          </td>
        ))}
        {rowActions && (
          <td className="py-2.5 px-2" onClick={(e) => e.stopPropagation()}>
            {rowActions(job)}
          </td>
        )}
        <td className="py-2.5 px-2">
          <button onClick={onExpand} className="p-1 text-gray-500 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-gray-800/50">
          <td colSpan={colSpan} className="px-4 py-3 bg-gray-900/50">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-2">
              {job.work_type && <div><span className="text-gray-500">Type:</span> {job.work_type}</div>}
              {job.work_arrangement && <div><span className="text-gray-500">Arrangement:</span> {job.work_arrangement}</div>}
              {job.recruiter_name && (
                <div><span className="text-gray-500">Recruiter:</span> {job.recruiter_name}{job.recruiter_agency ? ` (${job.recruiter_agency})` : ""}</div>
              )}
              {job.emails.length > 0 && <div><span className="text-gray-500">Emails:</span> {job.emails.join(", ")}</div>}
              {job.phone_numbers.length > 0 && <div><span className="text-gray-500">Phones:</span> {job.phone_numbers.join(", ")}</div>}
              {job.dm_name && (() => {
                const { firstName, lastName, fullName } = splitDmName(job.dm_name);
                return (
                  <div className="col-span-2 flex gap-4 flex-wrap">
                    <span><span className="text-gray-500">First:</span> {firstName}</span>
                    {lastName && <span><span className="text-gray-500">Last:</span> {lastName}</span>}
                    <span><span className="text-gray-500">Full:</span> {fullName}</span>
                    {job.dm_email && <span><span className="text-gray-500">Email:</span> {job.dm_email}</span>}
                    {job.dm_title && <span><span className="text-gray-500">Title:</span> {job.dm_title}</span>}
                  </div>
                );
              })()}
              {job.last_error && (
                <div className="col-span-2 text-red-400">
                  <span className="text-gray-500">Last error:</span> {job.last_error}
                </div>
              )}
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

"use client";

import { CheckSquare, Square, Phone, Mail, Building2 } from "lucide-react";
import { ScrapedLead, scoreColour } from "@/app/engine/leads/types";

type Props = {
  rows: ScrapedLead[];
  selected: Set<number>;
  onToggle: (i: number) => void;
  showScore?: boolean;
};

export function LeadsTable({ rows, selected, onToggle, showScore }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-800/50">
            <th className="w-8 px-3 py-2" />
            {showScore && (
              <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Score</th>
            )}
            <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Company</th>
            <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">
              <Phone className="h-3 w-3 inline mr-1" />Phone
            </th>
            <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">
              <Mail className="h-3 w-3 inline mr-1" />Email
            </th>
            <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">
              <Building2 className="h-3 w-3 inline mr-1" />Industry
            </th>
            {showScore && (
              <th className="px-3 py-2 text-left text-gray-400 font-medium uppercase tracking-wider">Opener</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((lead, i) => (
            <tr
              key={i}
              onClick={() => onToggle(i)}
              className={`border-b border-gray-800/50 cursor-pointer transition-colors ${
                selected.has(i) ? "bg-indigo-950/30" : "hover:bg-gray-800/30"
              }`}
            >
              <td className="px-3 py-2.5">
                {selected.has(i)
                  ? <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                  : <Square      className="h-3.5 w-3.5 text-gray-600" />}
              </td>
              {showScore && (
                <td className="px-3 py-2.5">
                  {lead.ai_score !== undefined
                    ? <span className={`font-bold text-sm ${scoreColour(lead.ai_score)}`}>{lead.ai_score}</span>
                    : <span className="text-gray-600">—</span>}
                </td>
              )}
              <td className="px-3 py-2.5 text-white font-medium">{lead.company || lead.name || "—"}</td>
              <td className="px-3 py-2.5 text-gray-400">{lead.phone  || lead.enriched_phone || "—"}</td>
              <td className="px-3 py-2.5 text-gray-400">{lead.email  || lead.enriched_email || "—"}</td>
              <td className="px-3 py-2.5 text-gray-400">{lead.industry || "—"}</td>
              {showScore && (
                <td className="px-3 py-2.5 text-gray-500 max-w-[200px] truncate" title={lead.call_opener}>
                  {lead.call_opener || "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

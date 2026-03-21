"use client";

import { CheckSquare, Square, Phone, Mail, User, Globe } from "lucide-react";
import { ScrapedLead, bestEmail, bestPhone } from "@/app/engine/leads/types";

type Props = {
  rows: ScrapedLead[];
  selected: Set<number>;
  onToggle: (i: number) => void;
  indexOffset?: number;
};

function Badge({ ok }: { ok: boolean }) {
  return ok
    ? <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
    : <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-700 mr-1.5" />;
}

export function LeadsTable({ rows, selected, onToggle, indexOffset = 0 }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/80">
            <th className="w-8 px-3 py-2.5" />
            <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wider">Company</th>
            <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wider">
              <User className="h-3 w-3 inline mr-1" />Decision Maker
            </th>
            <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wider">
              <Mail className="h-3 w-3 inline mr-1" />Email
            </th>
            <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wider">
              <Phone className="h-3 w-3 inline mr-1" />Phone / Mobile
            </th>
            <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wider">
              <Globe className="h-3 w-3 inline mr-1" />Website
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lead, idx) => {
            const i = indexOffset + idx;
            const email = bestEmail(lead);
            const phone = bestPhone(lead);
            const dm    = lead.decision_maker ?? "";
            return (
              <tr
                key={i}
                onClick={() => onToggle(i)}
                className={`border-b border-gray-800/50 cursor-pointer transition-colors ${
                  selected.has(i) ? "bg-indigo-950/30" : "hover:bg-gray-800/30"
                }`}
              >
                <td className="px-3 py-3">
                  {selected.has(i)
                    ? <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                    : <Square      className="h-3.5 w-3.5 text-gray-600" />}
                </td>
                <td className="px-3 py-3">
                  <p className="text-white font-semibold">{lead.company || lead.name || "—"}</p>
                  {lead.industry && <p className="text-gray-600 text-[10px] mt-0.5">{lead.industry}</p>}
                </td>
                <td className="px-3 py-3">
                  {dm
                    ? <span className="text-emerald-300 font-medium">{dm}</span>
                    : <span className="text-gray-700">Not found</span>}
                </td>
                <td className="px-3 py-3">
                  {email ? (
                    <a
                      href={`mailto:${email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Badge ok={true} />{email}
                    </a>
                  ) : (
                    <span className="text-gray-700"><Badge ok={false} />—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {phone ? (
                    <a
                      href={`tel:${phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Badge ok={true} />{phone}
                    </a>
                  ) : (
                    <span className="text-gray-700"><Badge ok={false} />—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {lead.website ? (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-500 hover:text-gray-300 transition-colors truncate max-w-[140px] block"
                    >
                      {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  ) : (
                    <span className="text-gray-700">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { Phone, Building2, Tag, Clock } from "lucide-react";
import { CrmLead } from "../page";

export default function LeadCard({ lead }: { lead: CrmLead }) {
  const overdue = lead.next_task_at && new Date(lead.next_task_at) < new Date();
  return (
    <div className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 hover:border-indigo-500 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white truncate">{lead.name}</p>
        {overdue && (
          <span className="shrink-0 text-[10px] bg-red-900/60 text-red-300 border border-red-700 rounded-full px-1.5 py-0.5">
            Overdue
          </span>
        )}
      </div>

      {lead.company && (
        <div className="flex items-center gap-1 mt-1">
          <Building2 className="h-3 w-3 text-gray-500 shrink-0" />
          <p className="text-xs text-gray-400 truncate">{lead.company}</p>
        </div>
      )}

      {lead.phone && (
        <div className="flex items-center gap-1 mt-0.5">
          <Phone className="h-3 w-3 text-gray-500 shrink-0" />
          <p className="text-xs text-gray-400">{lead.phone}</p>
        </div>
      )}

      {lead.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          <Tag className="h-2.5 w-2.5 text-gray-600 shrink-0" />
          {lead.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] bg-gray-700 text-gray-300 rounded px-1.5 py-0.5">{t}</span>
          ))}
        </div>
      )}

      {lead.last_called_at && (
        <div className="flex items-center gap-1 mt-1.5">
          <Clock className="h-2.5 w-2.5 text-gray-600 shrink-0" />
          <p className="text-[10px] text-gray-500">
            Last called {new Date(lead.last_called_at).toLocaleDateString("en-AU")}
          </p>
        </div>
      )}

      {lead.next_task_note && (
        <p className={`text-[10px] mt-1.5 rounded px-1.5 py-0.5 ${overdue ? "bg-red-900/40 text-red-300" : "bg-gray-700/60 text-gray-400"}`}>
          📌 {lead.next_task_note}
        </p>
      )}
    </div>
  );
}

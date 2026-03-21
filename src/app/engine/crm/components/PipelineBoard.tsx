"use client";

import { CrmLead } from "../page";
import LeadCard from "./LeadCard";

const STAGES: { key: CrmLead["pipeline_stage"]; label: string; color: string }[] = [
  { key: "new",          label: "New",         color: "border-gray-600" },
  { key: "contacted",    label: "Contacted",   color: "border-blue-500" },
  { key: "follow_up",    label: "Follow Up",   color: "border-yellow-500" },
  { key: "negotiation",  label: "Negotiation", color: "border-purple-500" },
  { key: "closed_won",   label: "Closed Won",  color: "border-emerald-500" },
  { key: "closed_lost",  label: "Closed Lost", color: "border-red-500" },
];

type Props = {
  leads: CrmLead[];
  onLeadClick: (lead: CrmLead) => void;
  onStageChange: (id: string, stage: CrmLead["pipeline_stage"]) => void;
};

export default function PipelineBoard({ leads, onLeadClick, onStageChange }: Props) {
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, stage: CrmLead["pipeline_stage"]) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) onStageChange(leadId, stage);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="flex-1 overflow-x-auto p-4">
      <div className="flex gap-3 min-w-max h-full">
        {STAGES.map(({ key, label, color }) => {
          const col = leads.filter((l) => l.pipeline_stage === key);
          return (
            <div
              key={key}
              className={`flex flex-col w-64 rounded-xl border-t-2 ${color} bg-gray-900 border border-gray-800 border-t-0`}
              onDrop={(e) => handleDrop(e, key)}
              onDragOver={handleDragOver}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{label}</span>
                <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">{col.length}</span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
                {col.length === 0 && (
                  <div className="text-center text-xs text-gray-600 pt-8">Drop leads here</div>
                )}
                {col.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => onLeadClick(lead)}
                    className="cursor-pointer"
                  >
                    <LeadCard lead={lead} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

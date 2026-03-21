"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
import PipelineBoard from "./components/PipelineBoard";
import LeadDrawer from "./components/LeadDrawer";
import AddLeadModal from "./components/AddLeadModal";

export type CallHistory = {
  id: string;
  lead_id: string;
  called_at: string;
  duration_seconds: number | null;
  outcome: string | null;
  notes: string | null;
};

export type CrmLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  industry: string | null;
  website: string | null;
  pipeline_stage: "new" | "contacted" | "follow_up" | "negotiation" | "closed_won" | "closed_lost";
  tags: string[];
  notes: string | null;
  last_called_at: string | null;
  next_task_at: string | null;
  next_task_note: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export default function CrmPage() {
  const [leads, setLeads]         = useState<CrmLead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<CrmLead | null>(null);
  const [showAdd, setShowAdd]     = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/engine/crm");
      const data = await res.json();
      setLeads(data.leads ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateLead = async (id: string, patch: Partial<CrmLead>) => {
    const res = await fetch(`/api/engine/crm/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.success) {
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...data.lead } : l));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...data.lead } : prev);
    }
    return data;
  };

  const deleteLead = async (id: string) => {
    await fetch(`/api/engine/crm/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const addLead = (lead: CrmLead) => {
    setLeads((prev) => [lead, ...prev]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div>
          <h1 className="text-lg font-bold text-white">CRM Pipeline</h1>
          <p className="text-xs text-gray-400 mt-0.5">{leads.length} leads total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeads}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Lead
          </button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading leads…
        </div>
      ) : (
        <PipelineBoard
          leads={leads}
          onLeadClick={(lead) => setSelected(lead)}
          onStageChange={(id, stage) => updateLead(id, { pipeline_stage: stage })}
        />
      )}

      {/* Lead drawer */}
      {selected && (
        <LeadDrawer
          lead={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateLead}
          onDelete={deleteLead}
        />
      )}

      {/* Add lead modal */}
      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onCreated={(lead) => { addLead(lead); setShowAdd(false); }}
        />
      )}
    </div>
  );
}

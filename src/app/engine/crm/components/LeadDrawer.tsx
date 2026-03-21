"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X, Phone, Mail, Globe, Building2, Tag, Clock, Trash2,
  PhoneCall, CheckCircle, XCircle, Voicemail, RefreshCw, Plus,
} from "lucide-react";
import { CrmLead, CallHistory } from "../page";

const STAGES: { key: CrmLead["pipeline_stage"]; label: string }[] = [
  { key: "new",         label: "New" },
  { key: "contacted",   label: "Contacted" },
  { key: "follow_up",   label: "Follow Up" },
  { key: "negotiation", label: "Negotiation" },
  { key: "closed_won",  label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
];

const OUTCOMES: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "no_answer",      label: "No Answer",      icon: <XCircle className="h-3.5 w-3.5" /> },
  { key: "voicemail",      label: "Voicemail",      icon: <Voicemail className="h-3.5 w-3.5" /> },
  { key: "callback",       label: "Callback",       icon: <RefreshCw className="h-3.5 w-3.5" /> },
  { key: "not_interested", label: "Not Interested", icon: <XCircle className="h-3.5 w-3.5" /> },
  { key: "interested",     label: "Interested",     icon: <CheckCircle className="h-3.5 w-3.5" /> },
  { key: "closed",         label: "Closed",         icon: <CheckCircle className="h-3.5 w-3.5" /> },
];

type Props = {
  lead: CrmLead;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<CrmLead>) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
};

export default function LeadDrawer({ lead, onClose, onUpdate, onDelete }: Props) {
  const [tab, setTab]               = useState<"details" | "history" | "tasks">("details");
  const [history, setHistory]       = useState<CallHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notes, setNotes]           = useState(lead.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [logOutcome, setLogOutcome] = useState("interested");
  const [logNotes, setLogNotes]     = useState("");
  const [logging, setLogging]       = useState(false);
  const [taskNote, setTaskNote]     = useState(lead.next_task_note ?? "");
  const [taskAt, setTaskAt]         = useState(
    lead.next_task_at ? lead.next_task_at.slice(0, 16) : ""
  );
  const [savingTask, setSavingTask] = useState(false);
  const [tagInput, setTagInput]     = useState("");
  const [deleting, setDeleting]     = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/engine/crm/${lead.id}`);
      const data = await res.json();
      setHistory(data.history ?? []);
    } finally {
      setLoadingHistory(false);
    }
  }, [lead.id]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab, fetchHistory]);

  const saveNotes = async () => {
    setSavingNotes(true);
    await onUpdate(lead.id, { notes });
    setSavingNotes(false);
  };

  const logCall = async () => {
    setLogging(true);
    await fetch(`/api/engine/crm/${lead.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: logOutcome, notes: logNotes }),
    });
    setLogNotes("");
    await fetchHistory();
    setLogging(false);
  };

  const saveTask = async () => {
    setSavingTask(true);
    await onUpdate(lead.id, {
      next_task_note: taskNote || null,
      next_task_at:   taskAt   || null,
    });
    setSavingTask(false);
  };

  const addTag = async () => {
    const t = tagInput.trim();
    if (!t || lead.tags.includes(t)) { setTagInput(""); return; }
    await onUpdate(lead.id, { tags: [...lead.tags, t] });
    setTagInput("");
  };

  const removeTag = async (tag: string) => {
    await onUpdate(lead.id, { tags: lead.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Drawer */}
      <aside className="relative z-10 flex flex-col w-full max-w-lg bg-gray-900 border-l border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-base font-bold text-white">{lead.name}</h2>
            {lead.company && <p className="text-xs text-gray-400 mt-0.5">{lead.company}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => { if (!confirm("Delete this lead?")) return; setDeleting(true); await onDelete(lead.id); }}
              disabled={deleting}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stage selector */}
        <div className="px-5 py-3 border-b border-gray-800">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Pipeline Stage</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s.key}
                onClick={() => onUpdate(lead.id, { pipeline_stage: s.key })}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  lead.pipeline_stage === s.key
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick info */}
        <div className="px-5 py-3 grid grid-cols-2 gap-2 border-b border-gray-800 text-xs text-gray-400">
          {lead.phone   && <div className="flex items-center gap-1.5"><Phone  className="h-3 w-3 shrink-0" />{lead.phone}</div>}
          {lead.email   && <div className="flex items-center gap-1.5"><Mail   className="h-3 w-3 shrink-0" />{lead.email}</div>}
          {lead.website && <div className="flex items-center gap-1.5 col-span-2"><Globe  className="h-3 w-3 shrink-0" /><a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-white underline truncate">{lead.website}</a></div>}
          {lead.industry && <div className="flex items-center gap-1.5 col-span-2"><Building2 className="h-3 w-3 shrink-0" />{lead.industry}</div>}
        </div>

        {/* Tags */}
        <div className="px-5 py-3 border-b border-gray-800">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {lead.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 text-[10px] bg-gray-800 border border-gray-700 text-gray-300 rounded-full px-2 py-0.5">
                <Tag className="h-2.5 w-2.5" />{t}
                <button onClick={() => removeTag(t)} className="text-gray-500 hover:text-red-400 ml-0.5">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder="Add tag…"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <button onClick={addTag} className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-5">
          {(["details", "history", "tasks"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 mr-4 text-xs font-medium capitalize border-b-2 transition-colors ${
                tab === t ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t === "history" ? "Call History" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Details tab */}
          {tab === "details" && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Add notes about this lead…"
                />
              </label>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {savingNotes ? "Saving…" : "Save Notes"}
              </button>
            </div>
          )}

          {/* Call History tab */}
          {tab === "history" && (
            <div className="space-y-4">
              {/* Log call form */}
              <div className="rounded-xl bg-gray-800 border border-gray-700 p-4">
                <p className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5 text-indigo-400" /> Log a Call
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => setLogOutcome(o.key)}
                      className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border transition-colors ${
                        logOutcome === o.key
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "border-gray-600 text-gray-400 hover:border-indigo-500"
                      }`}
                    >
                      {o.icon}{o.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  rows={2}
                  placeholder="Call notes…"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none mb-2"
                />
                <button
                  onClick={logCall}
                  disabled={logging}
                  className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {logging ? "Logging…" : "Log Call"}
                </button>
              </div>

              {/* History list */}
              {loadingHistory ? (
                <p className="text-xs text-gray-500 text-center py-4">Loading…</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-4">No calls logged yet</p>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          h.outcome === "closed" || h.outcome === "interested"
                            ? "bg-emerald-900/50 text-emerald-300"
                            : h.outcome === "not_interested"
                              ? "bg-red-900/50 text-red-300"
                              : "bg-gray-700 text-gray-400"
                        }`}>{h.outcome ?? "unknown"}</span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(h.called_at).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      {h.notes && <p className="text-xs text-gray-400 mt-1">{h.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks tab */}
          {tab === "tasks" && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Task / Reminder</span>
                <input
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="e.g. Send follow-up email"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Due Date & Time</span>
                <input
                  type="datetime-local"
                  value={taskAt}
                  onChange={(e) => setTaskAt(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </label>
              <button
                onClick={saveTask}
                disabled={savingTask}
                className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {savingTask ? "Saving…" : "Save Task"}
              </button>

              {lead.next_task_at && (
                <div className={`rounded-xl p-3 border text-xs ${
                  new Date(lead.next_task_at) < new Date()
                    ? "bg-red-900/20 border-red-700 text-red-300"
                    : "bg-indigo-900/20 border-indigo-700 text-indigo-300"
                }`}>
                  <p className="font-semibold mb-0.5">
                    {new Date(lead.next_task_at) < new Date() ? "⚠️ Overdue" : "📌 Upcoming"}
                  </p>
                  <p>{lead.next_task_note}</p>
                  <p className="mt-1 opacity-70">
                    {new Date(lead.next_task_at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, BookOpen, Trash2, Pencil, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import type { Training } from "@/types/engine";
import { VALID_VOICES } from "@/types/engine";

const VOICES = VALID_VOICES;

const BLANK: Omit<Training, "id" | "created_at" | "updated_at"> = {
  name: "", description: "", prompt: "", voice: "alloy", is_active: true, sort_order: 0,
};

export default function AdminTrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading]       = useState(true);
  const [createSaving, setCreateSaving] = useState(false);
  const [editSaving, setEditSaving]     = useState(false);
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [showNew, setShowNew]     = useState(false);
  const [form, setForm]           = useState({ ...BLANK });
  const [editing, setEditing]     = useState<Record<string, Training>>({});

  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/engine/trainings");
      const data = await res.json();
      setTrainings(data.trainings ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrainings(); }, [fetchTrainings]);

  const createTraining = async () => {
    if (!form.name.trim() || !form.prompt.trim()) return;
    setCreateSaving(true);
    try {
      const res = await fetch("/api/engine/trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setTrainings((prev) => [...prev, data.training]);
        setForm({ ...BLANK });
        setShowNew(false);
      }
    } finally {
      setCreateSaving(false);
    }
  };

  const saveEdit = async (id: string) => {
    const t = editing[id];
    if (!t) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/engine/trainings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
      const data = await res.json();
      if (data.success) {
        setTrainings((prev) => prev.map((x) => x.id === id ? data.training : x));
        setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
      }
    } finally {
      setEditSaving(false);
    }
  };

  const deleteTraining = async (id: string) => {
    if (!confirm("Delete this training?")) return;
    await fetch(`/api/engine/trainings/${id}`, { method: "DELETE" });
    setTrainings((prev) => prev.filter((t) => t.id !== id));
    setExpanded((prev) => prev === id ? null : prev);
  };

  const startEdit = (t: Training) => setEditing((prev) => ({ ...prev, [t.id]: { ...t } }));
  const cancelEdit = (id: string) => setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
  const patchEdit = (id: string, patch: Partial<Training>) =>
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BookOpen className="h-4 w-4 text-orange-400" />
            <h1 className="text-lg font-bold text-white">Training Sessions</h1>
          </div>
          <p className="text-xs text-gray-500">Create AI-powered cold call training sessions with custom prompts</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New Training
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* New training form */}
        {showNew && (
          <div className="rounded-2xl bg-gray-900 border border-orange-800/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-orange-300">New Training Session</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Name *</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Overcoming Price Objections"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Voice</span>
                <select
                  value={form.voice}
                  onChange={(e) => setForm((p) => ({ ...p, voice: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {VOICES.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Description</span>
                <input
                  value={form.description ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Short description of what this training covers"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">System Prompt * <span className="text-gray-600 normal-case tracking-normal">(instructions for the AI prospect)</span></span>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
                  rows={6}
                  placeholder={`You are a skeptical business owner receiving a cold call. The caller is trying to sell virtual assistant services. Start by being busy and dismissive. When they bring up price, push back hard with "we don't have budget for that right now." Give them a chance to handle your objections before closing...`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={createTraining}
                disabled={createSaving || !form.name.trim() || !form.prompt.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
              >
                {createSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Create Training
              </button>
              <button
                onClick={() => { setShowNew(false); setForm({ ...BLANK }); }}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Training list */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : trainings.length === 0 && !showNew ? (
          <div className="text-center py-12 text-gray-600">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No training sessions yet</p>
            <p className="text-xs mt-1">Click &quot;New Training&quot; to create your first one</p>
          </div>
        ) : trainings.map((t) => {
          const isEditing = !!editing[t.id];
          const editData  = editing[t.id] ?? t;
          const isOpen    = expanded === t.id;

          return (
            <div key={t.id} className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              {/* Header row */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${t.is_active ? "bg-emerald-400" : "bg-gray-600"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                    {t.description && <p className="text-xs text-gray-500 truncate">{t.description}</p>}
                  </div>
                  <span className="text-[10px] bg-gray-800 border border-gray-700 text-gray-400 rounded-full px-2 py-0.5 shrink-0">
                    {t.voice}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!isEditing && (
                    <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteTraining(t.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setExpanded(isOpen ? null : t.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expanded edit/view */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-800 pt-4 space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Name</span>
                          <input
                            value={editData.name}
                            onChange={(e) => patchEdit(t.id, { name: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Voice</span>
                          <select
                            value={editData.voice}
                            onChange={(e) => patchEdit(t.id, { voice: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                          >
                            {VOICES.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                          </select>
                        </label>
                        <label className="block md:col-span-2">
                          <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Description</span>
                          <input
                            value={editData.description ?? ""}
                            onChange={(e) => patchEdit(t.id, { description: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                          />
                        </label>
                        <label className="block md:col-span-2">
                          <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">System Prompt</span>
                          <textarea
                            value={editData.prompt}
                            onChange={(e) => patchEdit(t.id, { prompt: e.target.value })}
                            rows={8}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none font-mono text-xs"
                          />
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editData.is_active}
                            onChange={(e) => patchEdit(t.id, { is_active: e.target.checked })}
                            className="rounded border-gray-600 bg-gray-800"
                          />
                          <span className="text-xs text-gray-400">Active (visible to users)</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveEdit(t.id)}
                          disabled={editSaving}
                          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
                        >
                          {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Save
                        </button>
                        <button
                          onClick={() => cancelEdit(t.id)}
                          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">System Prompt</p>
                        <pre className="text-xs text-gray-300 bg-gray-800 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed">{t.prompt}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

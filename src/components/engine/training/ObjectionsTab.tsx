"use client";

import { useState, useCallback } from "react";
import { Plus, Loader2, Trash2, Pencil, Check, X, AlertTriangle, GripVertical, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import ObjectionResponsesPanel from "./ObjectionResponsesPanel";

export type Objection = {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

type Props = {
  objections: Objection[];
  loading: boolean;
  onAdd: (label: string) => Promise<void>;
  onEdit: (id: string, label: string) => Promise<void>;
  onToggle: (obj: Objection) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function ObjectionsTab({ objections, loading, onAdd, onEdit, onToggle, onDelete }: Props) {
  const [newLabel, setNewLabel]         = useState("");
  const [adding, setAdding]             = useState(false);
  const [editingObj, setEditingObj]     = useState<Record<string, string>>({});
  const [savingId, setSavingId]         = useState<string | null>(null);
  const [expanded, setExpanded]         = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpanded((prev) => prev === id ? null : id);

  const handleAdd = useCallback(async () => {
    const label = newLabel.trim();
    if (!label) return;
    setAdding(true);
    try {
      await onAdd(label);
      setNewLabel("");
    } finally {
      setAdding(false);
    }
  }, [newLabel, onAdd]);

  const handleEdit = useCallback(async (id: string) => {
    const label = editingObj[id]?.trim();
    if (!label) return;
    setSavingId(id);
    try {
      await onEdit(id, label);
      setEditingObj((p) => { const n = { ...p }; delete n[id]; return n; });
    } finally {
      setSavingId(null);
    }
  }, [editingObj, onEdit]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* ── Add new ── */}
      <div className="rounded-2xl bg-gray-900 border border-yellow-800/40 p-5">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Objection
        </p>
        <div className="flex gap-3">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. We already have something in place…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newLabel.trim()}
            className="flex items-center gap-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 px-5 py-3 text-sm font-semibold text-white transition-colors whitespace-nowrap"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </div>
      </div>

      {/* ── Cards grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-3" /> Loading…
        </div>
      ) : objections.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium">No objections yet</p>
          <p className="text-xs mt-2">Add one above or run <code className="text-gray-500">engine_objections.sql</code> to pre-load 15 defaults</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objections.map((obj) => (
            <div
              key={obj.id}
              className={`rounded-2xl border transition-all ${
                expanded === obj.id
                  ? "border-yellow-600 bg-yellow-950/20"
                  : "border-gray-700 bg-gray-900 hover:border-yellow-800"
              } ${!obj.is_active ? "opacity-50" : ""}`}
            >
              {/* ── Card header ── */}
              {editingObj[obj.id] !== undefined ? (
                <div className="flex items-center gap-2 p-4">
                  <input
                    value={editingObj[obj.id]}
                    onChange={(e) => setEditingObj((p) => ({ ...p, [obj.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(obj.id);
                      if (e.key === "Escape") setEditingObj((p) => { const n = { ...p }; delete n[obj.id]; return n; });
                    }}
                    autoFocus
                    className="flex-1 bg-gray-800 border border-yellow-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  <button onClick={() => handleEdit(obj.id)} disabled={savingId === obj.id} className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors" title="Save">
                    {savingId === obj.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setEditingObj((p) => { const n = { ...p }; delete n[obj.id]; return n; })} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Cancel">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  {/* Top row: badge + actions */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => onToggle(obj)}
                      title={obj.is_active ? "Deactivate" : "Activate"}
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border transition-colors ${
                        obj.is_active
                          ? "border-yellow-600 text-yellow-400 bg-yellow-900/30 hover:bg-yellow-900/50"
                          : "border-gray-700 text-gray-500 hover:bg-gray-800"
                      }`}
                    >
                      {obj.is_active ? "● Active" : "○ Off"}
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingObj((p) => ({ ...p, [obj.id]: obj.label }))} className="p-1.5 text-gray-600 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Edit label">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { if (confirm("Delete this objection and all its responses?")) onDelete(obj.id); }} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Big clickable label */}
                  <button
                    onClick={() => toggleExpand(obj.id)}
                    className="w-full text-left group"
                  >
                    <p className="text-lg font-semibold text-white group-hover:text-yellow-300 transition-colors leading-snug mb-3">
                      "{obj.label}"
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-yellow-700 transition-colors">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Click to {expanded === obj.id ? "hide" : "add / view"} responses</span>
                      {expanded === obj.id
                        ? <ChevronUp className="h-3.5 w-3.5 ml-auto" />
                        : <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                      }
                    </div>
                  </button>
                </div>
              )}

              {/* ── Responses panel ── */}
              {expanded === obj.id && (
                <div className="border-t border-yellow-800/30 px-4 pb-4 pt-3">
                  <ObjectionResponsesPanel objectionId={obj.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

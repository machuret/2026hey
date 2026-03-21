"use client";

import { useState, useCallback } from "react";
import { Plus, Loader2, Trash2, Pencil, Check, X, AlertTriangle, GripVertical } from "lucide-react";

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
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Add new */}
      <div className="rounded-2xl bg-gray-900 border border-yellow-800/40 p-4">
        <p className="text-xs font-semibold text-yellow-300 mb-3 flex items-center gap-1.5">
          <Plus className="h-3 w-3" /> Add Objection
        </p>
        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. We already have a solution for that…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newLabel.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Add
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      ) : objections.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No objections yet</p>
          <p className="text-xs mt-1">Add one above or run <code className="text-gray-500">engine_objections.sql</code> to pre-load 15 defaults</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden divide-y divide-gray-800">
          {objections.map((obj) => (
            <div
              key={obj.id}
              className={`flex items-center gap-3 px-4 py-3 transition-opacity ${!obj.is_active ? "opacity-40" : ""}`}
            >
              <GripVertical className="h-4 w-4 text-gray-700 shrink-0" aria-label="Drag to reorder (coming soon)" />
              <div className={`h-2 w-2 rounded-full shrink-0 ${obj.is_active ? "bg-yellow-400" : "bg-gray-600"}`} />

              {editingObj[obj.id] !== undefined ? (
                <>
                  <input
                    value={editingObj[obj.id]}
                    onChange={(e) => setEditingObj((p) => ({ ...p, [obj.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") handleEdit(obj.id); if (e.key === "Escape") setEditingObj((p) => { const n = { ...p }; delete n[obj.id]; return n; }); }}
                    autoFocus
                    className="flex-1 bg-gray-800 border border-yellow-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                  <button
                    onClick={() => handleEdit(obj.id)}
                    disabled={savingId === obj.id}
                    className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                    title="Save"
                  >
                    {savingId === obj.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setEditingObj((p) => { const n = { ...p }; delete n[obj.id]; return n; })}
                    className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                    title="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-white">{obj.label}</span>
                  <button
                    onClick={() => onToggle(obj)}
                    title={obj.is_active ? "Deactivate (hides from runner)" : "Activate"}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                      obj.is_active
                        ? "border-yellow-700 text-yellow-400 hover:bg-yellow-900/30"
                        : "border-gray-700 text-gray-500 hover:bg-gray-800"
                    }`}
                  >
                    {obj.is_active ? "active" : "off"}
                  </button>
                  <button
                    onClick={() => setEditingObj((p) => ({ ...p, [obj.id]: obj.label }))}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this objection?")) onDelete(obj.id); }}
                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, Trash2, Pencil, Check, X } from "lucide-react";

type Response = {
  id: string;
  objection_id: string;
  body: string;
  sort_order: number;
};

type Props = {
  objectionId: string;
};

export default function ObjectionResponsesPanel({ objectionId }: Props) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading]     = useState(true);
  const [newBody, setNewBody]     = useState("");
  const [adding, setAdding]       = useState(false);
  const [editing, setEditing]     = useState<Record<string, string>>({});
  const [savingId, setSavingId]   = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/engine/objection-responses?objection_id=${objectionId}`);
      const data = await res.json();
      setResponses(data.responses ?? []);
    } finally {
      setLoading(false);
    }
  }, [objectionId]);

  useEffect(() => { fetchResponses(); }, [fetchResponses]);

  const handleAdd = async () => {
    const body = newBody.trim();
    if (!body) return;
    setAdding(true);
    try {
      const res = await fetch("/api/engine/objection-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objection_id: objectionId, body }),
      });
      const data = await res.json();
      if (data.success) {
        setResponses((p) => [...p, data.response]);
        setNewBody("");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (id: string) => {
    const body = editing[id]?.trim();
    if (!body) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/engine/objection-responses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (data.success) {
        setResponses((p) => p.map((r) => r.id === id ? data.response : r));
        setEditing((p) => { const n = { ...p }; delete n[id]; return n; });
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this response?")) return;
    await fetch(`/api/engine/objection-responses/${id}`, { method: "DELETE" });
    setResponses((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div className="mt-3 ml-7 border-l-2 border-yellow-800/40 pl-4 space-y-2">
      {loading ? (
        <div className="flex items-center gap-2 py-2 text-gray-600 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading responses…
        </div>
      ) : (
        <>
          {responses.length === 0 && (
            <p className="text-xs text-gray-600 py-1">No responses yet — add one below.</p>
          )}
          {responses.map((r, i) => (
            <div key={r.id} className="flex items-start gap-2 group">
              <span className="text-[10px] text-yellow-700 font-bold mt-1.5 shrink-0 w-4">{i + 1}.</span>
              {editing[r.id] !== undefined ? (
                <>
                  <textarea
                    value={editing[r.id]}
                    onChange={(e) => setEditing((p) => ({ ...p, [r.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(r.id); }
                      if (e.key === "Escape") setEditing((p) => { const n = { ...p }; delete n[r.id]; return n; });
                    }}
                    autoFocus
                    rows={2}
                    className="flex-1 bg-gray-800 border border-yellow-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none resize-none"
                  />
                  <button
                    onClick={() => handleEdit(r.id)}
                    disabled={savingId === r.id}
                    className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors mt-0.5"
                    title="Save"
                  >
                    {savingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setEditing((p) => { const n = { ...p }; delete n[r.id]; return n; })}
                    className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors mt-0.5"
                    title="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm text-gray-300 leading-relaxed py-1">{r.body}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    <button
                      onClick={() => setEditing((p) => ({ ...p, [r.id]: r.body }))}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-red-500 hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add new response */}
          <div className="flex gap-2 pt-1">
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
              placeholder="Type a response script… (Enter to save, Shift+Enter for new line)"
              rows={2}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 resize-none"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newBody.trim()}
              className="flex items-center gap-1 rounded-lg bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap self-end"
            >
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Add
            </button>
          </div>
        </>
      )}
    </div>
  );
}

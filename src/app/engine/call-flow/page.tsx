"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, PhoneCall, Trash2, ChevronRight } from "lucide-react";
import FlowEditor from "./components/FlowEditor";
import FlowRunner from "./components/FlowRunner";

export type FlowNode = {
  id: string;
  tree_id: string;
  parent_id: string | null;
  node_type: "stage" | "objection" | "response";
  label: string;
  script: string | null;
  sort_order: number;
};

export type FlowTree = {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  created_at: string;
};

export default function CallFlowPage() {
  const [trees, setTrees]         = useState<FlowTree[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<FlowTree | null>(null);
  const [nodes, setNodes]         = useState<FlowNode[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [mode, setMode]           = useState<"editor" | "runner">("editor");
  const [creating, setCreating]   = useState(false);
  const [newName, setNewName]     = useState("");

  const fetchTrees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/engine/call-flow");
      const data = await res.json();
      setTrees(data.trees ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNodes = useCallback(async (treeId: string) => {
    setLoadingNodes(true);
    try {
      const res = await fetch(`/api/engine/call-flow/${treeId}`);
      const data = await res.json();
      setNodes(data.nodes ?? []);
    } finally {
      setLoadingNodes(false);
    }
  }, []);

  useEffect(() => { fetchTrees(); }, [fetchTrees]);

  useEffect(() => {
    if (selected) fetchNodes(selected.id);
  }, [selected, fetchNodes]);

  const createTree = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/engine/call-flow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    if (data.success) {
      setTrees((prev) => [data.tree, ...prev]);
      setSelected(data.tree);
      setNodes([]);
    }
    setNewName("");
    setCreating(false);
  };

  const deleteTree = async (id: string) => {
    if (!confirm("Delete this call flow?")) return;
    await fetch(`/api/engine/call-flow/${id}`, { method: "DELETE" });
    setTrees((prev) => prev.filter((t) => t.id !== id));
    if (selected?.id === id) { setSelected(null); setNodes([]); }
  };

  const addNode = async (node: Omit<FlowNode, "id" | "tree_id" | "created_at" | "updated_at">) => {
    if (!selected) return;
    const res = await fetch(`/api/engine/call-flow/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(node),
    });
    const data = await res.json();
    if (data.success) setNodes((prev) => [...prev, data.node]);
  };

  const updateNode = async (id: string, patch: Partial<FlowNode>) => {
    const res = await fetch(`/api/engine/nodes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.success) setNodes((prev) => prev.map((n) => n.id === id ? { ...n, ...data.node } : n));
  };

  const deleteNode = async (id: string) => {
    await fetch(`/api/engine/nodes/${id}`, { method: "DELETE" });
    setNodes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex h-full">
      {/* Sidebar — tree list */}
      <div className="w-64 shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-white mb-3">Call Flows</h2>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTree()}
              placeholder="New flow name…"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={createTree}
              disabled={creating || !newName.trim()}
              className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : trees.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-8">No flows yet</p>
          ) : (
            trees.map((tree) => (
              <div
                key={tree.id}
                onClick={() => setSelected(tree)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer group transition-colors ${
                  selected?.id === tree.id ? "bg-indigo-900/40 text-indigo-300" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-medium truncate">{tree.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTree(tree.id); }}
                    className="p-0.5 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <PhoneCall className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select or create a call flow</p>
            </div>
          </div>
        ) : (
          <>
            {/* Flow header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
              <div>
                <h1 className="text-base font-bold text-white">{selected.name}</h1>
                {selected.industry && <p className="text-xs text-gray-500 mt-0.5">{selected.industry}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode("editor")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mode === "editor" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setMode("runner")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mode === "runner" ? "bg-emerald-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  🟢 Live Call Mode
                </button>
              </div>
            </div>

            {loadingNodes ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : mode === "editor" ? (
              <FlowEditor
                nodes={nodes}
                treeId={selected.id}
                onAddNode={addNode}
                onUpdateNode={updateNode}
                onDeleteNode={deleteNode}
              />
            ) : (
              <FlowRunner nodes={nodes} onExit={() => setMode("editor")} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

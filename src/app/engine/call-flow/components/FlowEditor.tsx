"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Edit2, Check, X } from "lucide-react";
import { FlowNode } from "../page";

type Props = {
  nodes: FlowNode[];
  treeId: string;
  onAddNode: (node: Omit<FlowNode, "id" | "tree_id">) => Promise<void>;
  onUpdateNode: (id: string, patch: Partial<FlowNode>) => Promise<void>;
  onDeleteNode: (id: string) => Promise<void>;
};

const TYPE_COLORS: Record<string, string> = {
  stage:     "border-l-indigo-500 bg-indigo-950/30",
  objection: "border-l-yellow-500 bg-yellow-950/20",
  response:  "border-l-emerald-500 bg-emerald-950/20",
};

const TYPE_LABELS: Record<string, string> = {
  stage: "Stage", objection: "Objection", response: "Response",
};

function NodeRow({
  node, depth, nodes, onAddNode, onUpdateNode, onDeleteNode,
}: {
  node: FlowNode;
  depth: number;
  nodes: FlowNode[];
  onAddNode: Props["onAddNode"];
  onUpdateNode: Props["onUpdateNode"];
  onDeleteNode: Props["onDeleteNode"];
}) {
  const children = nodes.filter((n) => n.parent_id === node.id);
  const [expanded, setExpanded]   = useState(true);
  const [editing, setEditing]     = useState(false);
  const [editLabel, setEditLabel] = useState(node.label);
  const [editScript, setEditScript] = useState(node.script ?? "");
  const [adding, setAdding]       = useState(false);
  const [newLabel, setNewLabel]   = useState("");
  const [newType, setNewType]     = useState<FlowNode["node_type"]>("objection");

  const saveEdit = async () => {
    await onUpdateNode(node.id, { label: editLabel, script: editScript || null });
    setEditing(false);
  };

  const addChild = async () => {
    if (!newLabel.trim()) return;
    await onAddNode({
      parent_id: node.id,
      node_type: newType,
      label: newLabel,
      script: null,
      sort_order: children.length,
    });
    setNewLabel("");
    setAdding(false);
  };

  return (
    <div style={{ marginLeft: depth * 20 }} className="mt-1.5">
      <div className={`rounded-lg border-l-4 ${TYPE_COLORS[node.node_type]} border border-gray-700/50 px-3 py-2`}>
        {editing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button onClick={saveEdit} className="p-1 text-emerald-400 hover:text-emerald-300">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditing(false)} className="p-1 text-gray-500 hover:text-gray-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              value={editScript}
              onChange={(e) => setEditScript(e.target.value)}
              rows={3}
              placeholder="Script / response text…"
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-500 hover:text-gray-300 shrink-0"
              >
                {children.length > 0
                  ? expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                  : <span className="h-3.5 w-3.5 block" />
                }
              </button>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                node.node_type === "stage" ? "bg-indigo-900/60 text-indigo-300"
                : node.node_type === "objection" ? "bg-yellow-900/60 text-yellow-300"
                : "bg-emerald-900/60 text-emerald-300"
              }`}>{TYPE_LABELS[node.node_type]}</span>
              <span className="text-sm text-white font-medium truncate">{node.label}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setAdding(!adding)} className="p-1 text-gray-500 hover:text-indigo-400">
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditing(true)} className="p-1 text-gray-500 hover:text-blue-400">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { if (confirm("Delete this node and all its children?")) onDeleteNode(node.id); }}
                className="p-1 text-gray-500 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {node.script && !editing && (
          <p className="text-xs text-gray-400 mt-1.5 ml-7 italic border-l border-gray-700 pl-2">
            {node.script}
          </p>
        )}

        {/* Add child form */}
        {adding && (
          <div className="mt-2 ml-7 flex items-center gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as FlowNode["node_type"])}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="stage">Stage</option>
              <option value="objection">Objection</option>
              <option value="response">Response</option>
            </select>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addChild()}
              placeholder="Label…"
              autoFocus
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button onClick={addChild} className="p-1 text-emerald-400 hover:text-emerald-300">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setAdding(false)} className="p-1 text-gray-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {expanded && children.map((child) => (
        <NodeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          nodes={nodes}
          onAddNode={onAddNode}
          onUpdateNode={onUpdateNode}
          onDeleteNode={onDeleteNode}
        />
      ))}
    </div>
  );
}

export default function FlowEditor({ nodes, treeId, onAddNode, onUpdateNode, onDeleteNode }: Props) {
  const roots = nodes.filter((n) => n.parent_id === null);
  const [newRootLabel, setNewRootLabel] = useState("");
  const [newRootType, setNewRootType]   = useState<FlowNode["node_type"]>("stage");

  const addRoot = async () => {
    if (!newRootLabel.trim()) return;
    await onAddNode({
      parent_id: null,
      node_type: newRootType,
      label: newRootLabel,
      script: null,
      sort_order: roots.length,
    });
    setNewRootLabel("");
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Add root node */}
      <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-gray-800/50 border border-gray-700">
        <select
          value={newRootType}
          onChange={(e) => setNewRootType(e.target.value as FlowNode["node_type"])}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
        >
          <option value="stage">Stage</option>
          <option value="objection">Objection</option>
          <option value="response">Response</option>
        </select>
        <input
          value={newRootLabel}
          onChange={(e) => setNewRootLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRoot()}
          placeholder="Add root node (e.g. Opening, Intro)…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={addRoot}
          disabled={!newRootLabel.trim()}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {roots.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-sm">No nodes yet.</p>
          <p className="text-xs mt-1">Add a root node above to start building your call flow.</p>
        </div>
      ) : (
        roots.map((root) => (
          <NodeRow
            key={root.id}
            node={root}
            depth={0}
            nodes={nodes}
            onAddNode={onAddNode}
            onUpdateNode={onUpdateNode}
            onDeleteNode={onDeleteNode}
          />
        ))
      )}

      <div className="mt-6 text-xs text-gray-600 border-t border-gray-800 pt-4 flex gap-4">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" />Stage</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block" />Objection</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Response</span>
        <span className="ml-auto">Drag-and-drop reorder coming soon</span>
      </div>
    </div>
  );
}

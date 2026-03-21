"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, PhoneCall, AlertTriangle } from "lucide-react";
import { FlowNode } from "../page";

type GlobalObjection = { id: string; label: string; sort_order: number; is_active: boolean };

type Props = {
  nodes: FlowNode[];
  onExit: () => void;
};

const TYPE_COLOR: Record<string, string> = {
  stage:     "bg-indigo-900/40 border-indigo-600 text-indigo-200",
  objection: "bg-yellow-900/30 border-yellow-600 text-yellow-200",
  response:  "bg-emerald-900/30 border-emerald-600 text-emerald-200",
};

const CHILD_BTN_COLOR: Record<string, string> = {
  stage:     "border-indigo-700 hover:bg-indigo-900/40 text-indigo-300",
  objection: "border-yellow-700 hover:bg-yellow-900/30 text-yellow-300",
  response:  "border-emerald-700 hover:bg-emerald-900/30 text-emerald-300",
};

const CHILD_BADGE: Record<string, string> = {
  stage:     "bg-indigo-900/60 text-indigo-400",
  objection: "bg-yellow-900/60 text-yellow-400",
  response:  "bg-emerald-900/60 text-emerald-400",
};

export default function FlowRunner({ nodes, onExit }: Props) {
  const roots = nodes.filter((n) => n.parent_id === null).sort((a, b) => a.sort_order - b.sort_order);
  const [current, setCurrent] = useState<FlowNode | null>(roots[0] ?? null);
  const [history, setHistory] = useState<FlowNode[]>([]);
  const [globalObjections, setGlobalObjections] = useState<GlobalObjection[]>([]);
  // When viewing an objection from the global list, store it as a virtual node
  const [virtualObjection, setVirtualObjection] = useState<GlobalObjection | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/engine/objections", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setGlobalObjections((d.objections ?? []).filter((o: GlobalObjection) => o.is_active)))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const childrenOf = (id: string) =>
    nodes.filter((n) => n.parent_id === id).sort((a, b) => a.sort_order - b.sort_order);

  const navigate = (node: FlowNode) => {
    setVirtualObjection(null);
    if (current) setHistory((h) => [...h, current]);
    setCurrent(node);
  };

  const goBack = () => {
    if (virtualObjection) { setVirtualObjection(null); return; }
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrent(prev);
  };

  const reset = () => {
    setHistory([]);
    setVirtualObjection(null);
    setCurrent(roots[0] ?? null);
  };

  const children = current ? childrenOf(current.id) : [];


  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
      {/* Runner header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-white">Live Call Mode</span>
          {history.length > 0 && (
            <button onClick={goBack} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800">
            Reset
          </button>
          <button onClick={onExit} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800">
            <X className="h-3.5 w-3.5" /> Exit
          </button>
        </div>
      </div>

      {/* Breadcrumb trail */}
      {history.length > 0 && (
        <div className="flex items-center gap-1.5 px-6 py-2 border-b border-gray-800 overflow-x-auto">
          {history.map((h, i) => (
            <span key={h.id} className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0">
              {i > 0 && <span className="text-gray-700">›</span>}
              <button onClick={() => {
                const idx = history.indexOf(h);
                setHistory(history.slice(0, idx));
                setCurrent(h);
              }} className="hover:text-gray-400 truncate max-w-[120px]">{h.label}</button>
            </span>
          ))}
          {current && <span className="text-gray-700">›</span>}
          {current && <span className="text-xs text-white font-medium shrink-0 truncate max-w-[160px]">{current.label}</span>}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!current ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <PhoneCall className="h-12 w-12 mb-3 opacity-30" />
            <p>No nodes in this flow yet.</p>
          </div>
        ) : virtualObjection ? (
          /* ── Global objection selected ── */
          <>
            <div className="rounded-2xl border-2 bg-yellow-900/30 border-yellow-600 text-yellow-200 px-6 py-5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-yellow-500 text-yellow-300 bg-yellow-900/60">
                  objection
                </span>
                <span className="text-[10px] text-yellow-600 font-medium">global library</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{virtualObjection.label}</h2>
              <p className="text-xs text-yellow-600 mt-2">No scripted response saved for this objection yet. Add one in the Call Flow editor.</p>
            </div>
            <div className="text-center py-6 text-gray-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-800" />
              <p className="text-sm">No responses linked to this objection in this flow.</p>
              <button onClick={() => setVirtualObjection(null)} className="mt-3 text-xs text-yellow-500 hover:text-yellow-300">
                ← Back to openings
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Current node display */}
            <div className={`rounded-2xl border-2 px-6 py-5 mb-6 ${TYPE_COLOR[current.node_type]}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  current.node_type === "stage"
                    ? "border-indigo-500 text-indigo-300 bg-indigo-900/60"
                    : current.node_type === "objection"
                      ? "border-yellow-500 text-yellow-300 bg-yellow-900/60"
                      : "border-emerald-500 text-emerald-300 bg-emerald-900/60"
                }`}>
                  {current.node_type}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">{current.label}</h2>
              {current.script && (
                <div className="rounded-xl bg-black/30 border border-white/10 px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-widest">Script</p>
                  <p className="text-sm text-white leading-relaxed">{current.script}</p>
                </div>
              )}
            </div>

            {/* Flow-specific child nodes */}
            {children.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">
                  {current.node_type === "objection" ? "Select a Response" : "Prospect says…"}
                </p>
                <div className="grid gap-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => navigate(child)}
                      className={`text-left rounded-xl border px-4 py-3 transition-all ${CHILD_BTN_COLOR[child.node_type]} hover:scale-[1.01]`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${CHILD_BADGE[child.node_type]}`}>{child.node_type}</span>
                        <span className="text-sm font-medium">{child.label}</span>
                      </div>
                      {child.script && (
                        <p className="text-xs opacity-60 mt-1 truncate">{child.script.slice(0, 80)}…</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Global objections — shown on stage nodes */}
            {current.node_type === "stage" && globalObjections.length > 0 && (
              <div>
                <p className="text-xs text-yellow-600/80 uppercase tracking-widest mb-3 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> Prospect throws an objection…
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {globalObjections.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => setVirtualObjection(obj)}
                      className="text-left rounded-xl border border-yellow-800/60 bg-yellow-950/20 px-4 py-2.5 text-yellow-300 hover:bg-yellow-900/30 hover:border-yellow-600 transition-all text-sm font-medium"
                    >
                      {obj.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {children.length === 0 && current.node_type !== "stage" && (
              <div className="text-center py-8 text-gray-600">
                <p className="text-sm">End of this branch</p>
                <button onClick={goBack} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">
                  ← Go back
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

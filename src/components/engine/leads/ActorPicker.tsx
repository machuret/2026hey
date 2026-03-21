"use client";

import { Filter } from "lucide-react";
import { ACTORS, CATEGORY_META, ActorCategory, ActorDef } from "@/app/engine/leads/types";

type Props = {
  actorId: string;
  catFilter: ActorCategory | "all";
  onActorChange: (id: string) => void;
  onCatChange: (c: ActorCategory | "all") => void;
  filteredActors: ActorDef[];
};

export function ActorPicker({ actorId, catFilter, onActorChange, onCatChange, filteredActors }: Props) {
  return (
    <div className="space-y-3">
      {/* Category filter pills */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs text-gray-500 mr-1">Category:</span>
        {(["all", "scrape", "enrich", "intel"] as const).map((c) => (
          <button
            key={c}
            onClick={() => onCatChange(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              catFilter === c ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {c === "all" ? "All" : CATEGORY_META[c].label}
          </button>
        ))}
      </div>

      {/* Actor cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredActors.map((a) => (
          <button
            key={a.id}
            onClick={() => onActorChange(a.id)}
            className={`text-left p-4 rounded-xl border transition-colors ${
              actorId === a.id
                ? "border-indigo-500 bg-indigo-950/30"
                : "border-gray-800 bg-gray-900 hover:border-gray-700"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-white leading-tight">{a.label}</span>
              <span className={`shrink-0 ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_META[a.category].colour}`}>
                {CATEGORY_META[a.category].label}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{a.description}</p>
            <p className="text-[10px] text-gray-600">Cost/1k: {a.costPer1k}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { BookOpen } from "lucide-react";
import type { Training } from "@/types/engine";

type Props = {
  trainings: Training[];
  selected: Training | null;
  inCall: boolean;
  onSelect: (t: Training) => void;
};

export function TrainingSidebar({ trainings, selected, inCall, onSelect }: Props) {
  return (
    <div className="w-64 shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Training Sessions</h2>
        </div>
        <p className="text-xs text-gray-500 mt-1">Pick a scenario to practice</p>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {trainings.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-8 px-4">
            No training sessions available yet
          </p>
        ) : (
          trainings.map((t) => (
            <button
              key={t.id}
              onClick={() => { if (!inCall) onSelect(t); }}
              disabled={inCall}
              className={`w-full text-left px-4 py-3 transition-colors ${
                selected?.id === t.id
                  ? "bg-indigo-900/40 border-l-2 border-indigo-500"
                  : "text-gray-400 hover:bg-gray-800 border-l-2 border-transparent"
              } ${inCall ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <p className={`text-xs font-semibold ${selected?.id === t.id ? "text-indigo-300" : "text-white"}`}>
                {t.name}
              </p>
              {t.description && (
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{t.description}</p>
              )}
              <p className="text-[10px] text-gray-600 mt-1">Voice: {t.voice}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

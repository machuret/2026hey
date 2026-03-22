"use client";

import {
  TrendingUp, MessageSquare, AlertTriangle, CheckCircle2, X,
} from "lucide-react";
import type { CoachingReport } from "@/app/api/engine/training/coach/route";
import { ScoreBadge } from "./ScoreBadge";

type Props = {
  report: CoachingReport;
  scenarioName: string;
  onClose: () => void;
};

export function CoachingPanel({ report, scenarioName, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Call Debrief</h2>
            <p className="text-xs text-gray-500 mt-0.5">{scenarioName}</p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBadge score={report.score} />
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          {report.summary && (
            <p className="text-sm text-gray-300 italic border-l-2 border-indigo-600 pl-4">
              {report.summary}
            </p>
          )}

          {/* Talk ratio + filler words */}
          <div className="grid grid-cols-2 gap-4">
            {/* Talk ratio */}
            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Talk Ratio</p>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium">You</span>
                    <span className="text-indigo-400">{report.talkRatio.you}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-700">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${report.talkRatio.you}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Prospect</span>
                    <span className="text-gray-400">{report.talkRatio.prospect}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-700">
                    <div className="h-full rounded-full bg-gray-500" style={{ width: `${report.talkRatio.prospect}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 mt-2">
                {report.talkRatio.you > 60
                  ? "⚠ You talked too much — listen more"
                  : report.talkRatio.you < 30
                  ? "⚠ Prospect dominated — ask more questions"
                  : "✓ Good balance"}
              </p>
            </div>

            {/* Filler words */}
            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Filler Words{" "}
                  {report.fillerTotal > 0 && (
                    <span className="text-amber-400">({report.fillerTotal})</span>
                  )}
                </p>
              </div>
              {report.fillerWords.length === 0 ? (
                <p className="text-xs text-emerald-400">✓ No filler words detected</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {report.fillerWords.slice(0, 6).map(({ word, count }) => (
                    <span
                      key={word}
                      className="text-[10px] rounded-full bg-amber-900/30 border border-amber-800/50 text-amber-300 px-2 py-0.5"
                    >
                      &ldquo;{word}&rdquo; &times;{count}
                    </span>
                  ))}
                </div>
              )}
              {report.fillerTotal > 5 && (
                <p className="text-[10px] text-gray-600 mt-2">Slow down — fillers undermine confidence</p>
              )}
            </div>
          </div>

          {/* Objections */}
          {report.objections.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Objections</p>
              </div>
              <div className="space-y-2">
                {report.objections.map((obj, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 ${
                      obj.rating === "good" ? "border-emerald-800/50 bg-emerald-900/10"
                      : obj.rating === "ok" ? "border-amber-800/50 bg-amber-900/10"
                      : "border-red-800/50 bg-red-900/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-white">&ldquo;{obj.objection}&rdquo;</p>
                      <span
                        className={`shrink-0 text-[10px] rounded-full px-2 py-0.5 font-semibold ${
                          obj.rating === "good" ? "bg-emerald-900/40 text-emerald-400"
                          : obj.rating === "ok" ? "bg-amber-900/40 text-amber-400"
                          : "bg-red-900/40 text-red-400"
                        }`}
                      >
                        {obj.rating === "good" ? "✓ Good" : obj.rating === "ok" ? "~ OK" : "✗ Missed"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{obj.howHandled}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What went well / improve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.wentWell.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What Went Well</p>
                </div>
                <ul className="space-y-1.5">
                  {report.wentWell.map((item, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2">
                      <span className="text-emerald-500 shrink-0">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.improve.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Improve Next Time</p>
                </div>
                <ul className="space-y-1.5">
                  {report.improve.map((item, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2">
                      <span className="text-indigo-400 shrink-0">→</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Got it — Practice Again
          </button>
        </div>
      </div>
    </div>
  );
}

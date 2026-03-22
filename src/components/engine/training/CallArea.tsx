"use client";

import { useEffect, useRef } from "react";
import {
  Mic, MicOff, PhoneCall, PhoneOff, Loader2, RotateCcw, Volume2, Star,
} from "lucide-react";
import type { Training } from "@/types/engine";
import type { Message } from "@/hooks/useTrainingCall";

type Props = {
  selected: Training;
  messages: Message[];
  inCall: boolean;
  thinking: boolean;
  listening: boolean;
  transcript: string;
  error: string;
  coaching: boolean;
  recognitionRef: React.RefObject<{ stop: () => void } | null>;
  onStartCall: () => void;
  onEndCall: () => void;
  onRestart: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onViewDebrief: () => void;
};

export function CallArea({
  selected, messages, inCall, thinking, listening,
  transcript, error, coaching, recognitionRef,
  onStartCall, onEndCall, onRestart, onStartListening, onStopListening, onViewDebrief,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div>
          <h1 className="text-base font-bold text-white">{selected.name}</h1>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Volume2 className="h-3 w-3" /> Voice: {selected.voice}
            {inCall && <span className="ml-2 text-emerald-400 font-semibold">● Live</span>}
            {coaching && (
              <span className="ml-2 text-amber-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Analysing…
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {inCall ? (
            <>
              <button
                onClick={onRestart}
                disabled={thinking}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restart
              </button>
              <button
                onClick={onEndCall}
                disabled={thinking}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                <PhoneOff className="h-3.5 w-3.5" /> End Call
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {messages.length > 3 && !coaching && (
                <button
                  onClick={onViewDebrief}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-amber-400 hover:bg-gray-800 border border-amber-800/50 transition-colors"
                >
                  <Star className="h-3.5 w-3.5" /> View Debrief
                </button>
              )}
              <button
                onClick={onStartCall}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                <PhoneCall className="h-4 w-4" /> Start Call
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !thinking && (
          <div className="text-center text-gray-600 py-12">
            <Mic className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Press Start Call to begin your practice session</p>
            <p className="text-xs mt-1">The AI will play a realistic prospect — you handle the call</p>
            <p className="text-xs mt-1 text-gray-700">
              After the call, you&apos;ll get a coaching debrief with score + feedback
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-sm"
              }`}
            >
              <p className={`text-[10px] font-semibold mb-1 ${m.role === "user" ? "text-indigo-200" : "text-gray-500"}`}>
                {m.role === "user" ? "You" : "Prospect (AI)"}
              </p>
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <p className="text-[10px] font-semibold text-gray-500 mb-1">Prospect (AI)</p>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">thinking…</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Voice input bar */}
      {inCall && (
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              onClick={listening ? onStopListening : onStartListening}
              disabled={thinking}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                listening
                  ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              }`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {listening ? "Stop" : "Speak"}
            </button>
            <div className="flex-1 min-h-[40px] rounded-xl bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-gray-400">
              {listening
                ? <span className="text-indigo-300">{transcript || "Listening…"}</span>
                : <span className="text-gray-600">Press Speak and talk — AI will respond with voice</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

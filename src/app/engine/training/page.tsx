"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { BookOpen, Mic, MicOff, PhoneCall, PhoneOff, Loader2, RotateCcw, Volume2 } from "lucide-react";
import type { Training } from "@/types/engine";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function TrainingPage() {
  const [trainings, setTrainings]   = useState<Training[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<Training | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [inCall, setInCall]         = useState(false);
  const [thinking, setThinking]     = useState(false);
  const [listening, setListening]   = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError]           = useState("");
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const recognitionRef              = useRef<{ stop: () => void } | null>(null);
  // Stable ref so onresult always sees the latest messages without stale closure
  const messagesRef                 = useRef<Message[]>([]);

  const fetchTrainings = useCallback(async () => {
    try {
      const res = await fetch("/api/engine/trainings");
      const data = await res.json();
      setTrainings((data.trainings ?? []).filter((t: Training) => t.is_active));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrainings(); }, [fetchTrainings]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const playAudio = (base64: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.play().catch(() => {});
  };

  // Keep ref in sync every render
  messagesRef.current = messages;

  const sendMessage = useCallback(async (text: string, history: Message[]) => {
    if (!selected || !text.trim()) return;
    setThinking(true);
    setError("");
    const updated: Message[] = [...history, { role: "user", content: text }];
    setMessages(updated);

    try {
      const res = await fetch("/api/engine/training/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, prompt: selected.prompt, voice: selected.voice }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      const reply: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, reply]);
      if (data.audio) playAudio(data.audio);
    } catch {
      setError("Network error — please try again");
    } finally {
      setThinking(false);
    }
  }, [selected]);

  const startCall = async () => {
    if (!selected) return;
    setInCall(true);
    setMessages([]);
    setError("");
    // AI speaks first
    await sendMessage("(call starts — say hello and begin your opening pitch)", []);
  };

  const endCall = () => {
    setInCall(false);
    setListening(false);
    setTranscript("");
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const startListening = () => {
    type SR = {
      lang: string; interimResults: boolean; continuous: boolean;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
      start: () => void;
      stop: () => void;
    };
    type SRCtor = new () => SR;
    const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    const SpeechRecognitionAPI = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-AU";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart  = () => { setListening(true); setTranscript(""); };
    recognition.onend    = () => setListening(false);
    recognition.onerror  = () => setListening(false);
    recognition.onresult = (e) => {
      const t = e.results.map((r) => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        recognition.stop();
        setTranscript("");
        // Use ref to get latest messages — avoids stale closure
        sendMessage(t, messagesRef.current);
      }
    };

    recognition.start();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading trainings…
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar — training selector */}
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
            <p className="text-xs text-gray-600 text-center py-8 px-4">No training sessions available yet</p>
          ) : trainings.map((t) => (
            <button
              key={t.id}
              onClick={() => { if (!inCall) { setSelected(t); setMessages([]); setError(""); } }}
              disabled={inCall}
              className={`w-full text-left px-4 py-3 transition-colors ${
                selected?.id === t.id
                  ? "bg-indigo-900/40 border-l-2 border-indigo-500"
                  : "text-gray-400 hover:bg-gray-800 border-l-2 border-transparent"
              } ${inCall ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <p className={`text-xs font-semibold ${selected?.id === t.id ? "text-indigo-300" : "text-white"}`}>{t.name}</p>
              {t.description && <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{t.description}</p>}
              <p className="text-[10px] text-gray-600 mt-1">Voice: {t.voice}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main call area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <PhoneCall className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a training session to begin</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
              <div>
                <h1 className="text-base font-bold text-white">{selected.name}</h1>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> Voice: {selected.voice}
                  {inCall && <span className="ml-2 text-emerald-400 font-semibold">● Live</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inCall ? (
                  <>
                    <button
                      onClick={() => { setMessages([]); startCall(); }}
                      disabled={thinking}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restart
                    </button>
                    <button
                      onClick={endCall}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
                    >
                      <PhoneOff className="h-3.5 w-3.5" /> End Call
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startCall}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                  >
                    <PhoneCall className="h-4 w-4" /> Start Call
                  </button>
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
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-sm"
                  }`}>
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
                    onClick={listening ? () => recognitionRef.current?.stop() : startListening}
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
          </>
        )}
      </div>
    </div>
  );
}

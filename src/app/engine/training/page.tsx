"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  BookOpen, Mic, MicOff, PhoneCall, PhoneOff, Loader2, RotateCcw, Volume2,
  Star, TrendingUp, AlertTriangle, CheckCircle2, MessageSquare, X,
} from "lucide-react";
import type { Training } from "@/types/engine";
import type { CoachingReport } from "@/app/api/engine/training/coach/route";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function ScoreBadge({ score }: { score: number }) {
  const colour = score >= 8 ? "text-emerald-400 border-emerald-700 bg-emerald-900/30"
    : score >= 6 ? "text-amber-400 border-amber-700 bg-amber-900/30"
    : "text-red-400 border-red-700 bg-red-900/30";
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${colour}`}>
      <Star className="h-4 w-4 fill-current" />
      <span className="text-xl font-bold">{score}</span>
      <span className="text-xs opacity-70">/10</span>
    </div>
  );
}

function CoachingPanel({ report, scenarioName, onClose }: {
  report: CoachingReport; scenarioName: string; onClose: () => void;
}) {
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
            <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          {report.summary && (
            <p className="text-sm text-gray-300 italic border-l-2 border-indigo-600 pl-4">{report.summary}</p>
          )}

          {/* Talk ratio + filler words */}
          <div className="grid grid-cols-2 gap-4">
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
                {report.talkRatio.you > 60 ? "⚠ You talked too much — listen more" :
                 report.talkRatio.you < 30 ? "⚠ Prospect dominated — ask more questions" :
                 "✓ Good balance"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Filler Words {report.fillerTotal > 0 && <span className="text-amber-400">({report.fillerTotal})</span>}
                </p>
              </div>
              {report.fillerWords.length === 0 ? (
                <p className="text-xs text-emerald-400">✓ No filler words detected</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {report.fillerWords.slice(0, 6).map(({ word, count }) => (
                    <span key={word} className="text-[10px] rounded-full bg-amber-900/30 border border-amber-800/50 text-amber-300 px-2 py-0.5">
                      "{word}" ×{count}
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
                  <div key={i} className={`rounded-xl border p-3 ${
                    obj.rating === "good" ? "border-emerald-800/50 bg-emerald-900/10" :
                    obj.rating === "ok"   ? "border-amber-800/50 bg-amber-900/10" :
                                           "border-red-800/50 bg-red-900/10"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-white">"{obj.objection}"</p>
                      <span className={`shrink-0 text-[10px] rounded-full px-2 py-0.5 font-semibold ${
                        obj.rating === "good" ? "bg-emerald-900/40 text-emerald-400" :
                        obj.rating === "ok"   ? "bg-amber-900/40 text-amber-400" :
                                               "bg-red-900/40 text-red-400"
                      }`}>
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
  const [coaching, setCoaching]     = useState(false);
  const [report, setReport]         = useState<CoachingReport | null>(null);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const recognitionRef              = useRef<{ stop: () => void } | null>(null);
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
    setReport(null);
    await sendMessage("(call starts — say hello and begin your opening pitch)", []);
  };

  const endCall = async () => {
    setInCall(false);
    setListening(false);
    setTranscript("");
    if (recognitionRef.current) recognitionRef.current.stop();

    const finalMessages = messagesRef.current;
    if (finalMessages.length < 4) return; // too short to coach

    setCoaching(true);
    try {
      const res = await fetch("/api/engine/training/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: finalMessages, scenarioName: selected?.name ?? "" }),
      });
      const data = await res.json();
      if (data.report) setReport(data.report);
    } catch { /* coaching is optional — don't block */ }
    finally { setCoaching(false); }
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
    <>
      {/* Coaching report modal */}
      {report && selected && (
        <CoachingPanel
          report={report}
          scenarioName={selected.name}
          onClose={() => setReport(null)}
        />
      )}

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
                onClick={() => { if (!inCall) { setSelected(t); setMessages([]); setError(""); setReport(null); } }}
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
                    {coaching && <span className="ml-2 text-amber-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Analysing…</span>}
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
                          onClick={async () => {
                            setReport(null);
                            const r = await fetch("/api/engine/training/coach", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ messages, scenarioName: selected.name }),
                            });
                            const d = await r.json();
                            if (d.report) setReport(d.report);
                          }}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-amber-400 hover:bg-gray-800 border border-amber-800/50 transition-colors"
                        >
                          <Star className="h-3.5 w-3.5" /> View Debrief
                        </button>
                      )}
                      <button
                        onClick={startCall}
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
                    <p className="text-xs mt-1 text-gray-700">After the call, you&apos;ll get a coaching debrief with score + feedback</p>
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
    </>
  );
}

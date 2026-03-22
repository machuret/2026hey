"use client";

import { useState, useRef, useCallback } from "react";
import type { Training } from "@/types/engine";
import type { CoachingReport } from "@/app/api/engine/training/coach/route";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

type UseTrainingCallReturn = {
  messages: Message[];
  inCall: boolean;
  thinking: boolean;
  listening: boolean;
  transcript: string;
  error: string;
  coaching: boolean;
  report: CoachingReport | null;
  bottomRef: React.RefObject<HTMLDivElement>;
  recognitionRef: React.RefObject<SpeechRecognition | null>;
  startCall: (scenario: Training) => Promise<void>;
  endCall: (scenarioName: string) => Promise<void>;
  startListening: (scenario: Training) => void;
  resetReport: () => void;
  refetchDebrief: (scenarioName: string) => Promise<void>;
};

function playAudio(base64: string) {
  const audio = new Audio(`data:audio/mp3;base64,${base64}`);
  audio.play().catch(() => {});
}

export function useTrainingCall(): UseTrainingCallReturn {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [inCall, setInCall]         = useState(false);
  const [thinking, setThinking]     = useState(false);
  const [listening, setListening]   = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError]           = useState("");
  const [coaching, setCoaching]     = useState(false);
  const [report, setReport]         = useState<CoachingReport | null>(null);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesRef    = useRef<Message[]>([]);

  // Keep ref in sync with state — used inside SR callbacks to avoid stale closures
  messagesRef.current = messages;

  const sendMessage = useCallback(async (
    text: string,
    history: Message[],
    scenario: Training,
  ) => {
    if (!text.trim()) return;
    setThinking(true);
    setError("");
    const updated: Message[] = [...history, { role: "user", content: text }];
    setMessages(updated);

    try {
      const res = await fetch("/api/engine/training/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, prompt: scenario.prompt, voice: scenario.voice }),
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
  }, []);

  const fetchCoaching = useCallback(async (msgs: Message[], scenarioName: string) => {
    if (msgs.filter((m) => m.role === "user").length < 2) return;
    setCoaching(true);
    try {
      const res = await fetch("/api/engine/training/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, scenarioName }),
      });
      const data = await res.json();
      if (data.report) setReport(data.report);
    } catch { /* coaching is optional — never block the user */ }
    finally { setCoaching(false); }
  }, []);

  const startCall = useCallback(async (scenario: Training) => {
    setInCall(true);
    setMessages([]);
    setError("");
    setReport(null);
    await sendMessage("(call starts — say hello and begin your opening pitch)", [], scenario);
  }, [sendMessage]);

  const endCall = useCallback(async (scenarioName: string) => {
    setInCall(false);
    setListening(false);
    setTranscript("");
    if (recognitionRef.current) recognitionRef.current.stop();
    await fetchCoaching(messagesRef.current, scenarioName);
  }, [fetchCoaching]);

  const refetchDebrief = useCallback(async (scenarioName: string) => {
    setReport(null);
    await fetchCoaching(messagesRef.current, scenarioName);
  }, [fetchCoaching]);

  const startListening = useCallback((scenario: Training) => {
    const SpeechRecognitionAPI =
      (typeof window !== "undefined" && (window.SpeechRecognition ?? window.webkitSpeechRecognition)) || null;

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionAPI();
    recognition.lang           = "en-AU";
    recognition.interimResults = true;
    recognition.continuous     = false;
    recognitionRef.current     = recognition;

    recognition.onstart  = () => { setListening(true); setTranscript(""); };
    recognition.onend    = () => setListening(false);
    recognition.onerror  = () => setListening(false);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join("");
      setTranscript(t);
      if (Array.from(e.results).at(-1)?.isFinal) {
        recognition.stop();
        setTranscript("");
        sendMessage(t, messagesRef.current, scenario);
      }
    };

    recognition.start();
  }, [sendMessage]);

  const resetReport = useCallback(() => setReport(null), []);

  return {
    messages, inCall, thinking, listening, transcript,
    error, coaching, report,
    bottomRef, recognitionRef,
    startCall, endCall, startListening, resetReport, refetchDebrief,
  };
}

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Youtube, Instagram, Link2, Loader2, Trash2, ChevronDown, ChevronUp,
  Sparkles, CheckCircle2, AlertCircle, FileText, Clock,
} from "lucide-react";
import type { Transcript, TranscriptFull } from "@/types/engine";
import { SOURCE_COLOURS, detectTranscriptSource } from "@/types/engine";

const SOURCE_OPTIONS = [
  { value: "youtube",   label: "YouTube",   icon: Youtube },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "tiktok",    label: "TikTok",    icon: Link2 },
  { value: "other",     label: "Other",     icon: Link2 },
] as const;

export default function AdminTranscribePage() {
  const [url, setUrl]                   = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [transcripts, setTranscripts]   = useState<Transcript[]>([]);
  const [loading, setLoading]           = useState(true);
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [fullData, setFullData]         = useState<Record<string, TranscriptFull>>({});
  const [analysing, setAnalysing]       = useState<string | null>(null);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  const fetchTranscripts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/engine/transcribe");
      const data = await res.json();
      setTranscripts(data.transcripts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTranscripts(); }, [fetchTranscripts]);

  // Auto-detect source label from URL — memoised so it doesn't recompute every render
  const detectedSource = useMemo(() => {
    if (!url.trim()) return null;
    return detectTranscriptSource(url);
  }, [url]);

  const runTranscribe = async () => {
    if (!url.trim()) { setError("Enter a URL to transcribe"); return; }
    setTranscribing(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/engine/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Transcription failed");
        return;
      }
      setSuccess(`Transcribed: "${data.title}"`);
      setUrl("");
      // Auto-clear success banner after 4 seconds
      setTimeout(() => setSuccess(""), 4000);
      await fetchTranscripts();
    } catch {
      setError("Network error — please try again");
    } finally {
      setTranscribing(false);
    }
  };

  const expandTranscript = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (fullData[id]) return;
    try {
      const res = await fetch(`/api/engine/transcribe/${id}`);
      const data = await res.json();
      if (data.transcript) setFullData((prev) => ({ ...prev, [id]: data.transcript }));
    } catch { /* non-fatal */ }
  };

  const analyseTranscript = async (id: string) => {
    setAnalysing(id);
    setError("");
    try {
      const res = await fetch("/api/engine/transcribe/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Analysis failed"); return; }
      // Update both lists with the new analysis
      setTranscripts((prev) => prev.map((t) => t.id === id ? { ...t, analysis: data.analysis } : t));
      setFullData((prev) => prev[id] ? { ...prev, [id]: { ...prev[id], analysis: data.analysis } } : prev);
    } catch {
      setError("Network error during analysis");
    } finally {
      setAnalysing(null);
    }
  };

  const deleteTranscript = async (id: string) => {
    if (!confirm("Delete this transcript?")) return;
    await fetch(`/api/engine/transcribe/${id}`, { method: "DELETE" });
    setTranscripts((prev) => prev.filter((t) => t.id !== id));
    setExpanded((prev) => prev === id ? null : prev);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FileText className="h-4 w-4 text-orange-400" />
            <h1 className="text-lg font-bold text-white">Video Transcribe</h1>
          </div>
          <p className="text-xs text-gray-500">
            Transcribe YouTube &amp; Instagram sales training videos, then analyse with OpenAI to generate training material
          </p>
        </div>
        <div className="flex items-center gap-2">
          {SOURCE_OPTIONS.slice(0, 2).map(({ value, label, icon: Icon }) => (
            <span key={value} className={`hidden sm:flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full border ${SOURCE_COLOURS[value]}`}>
              <Icon className="h-3 w-3" /> {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* URL Input */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Transcribe a Video</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(""); setSuccess(""); }}
                  onKeyDown={(e) => e.key === "Enter" && runTranscribe()}
                  placeholder="https://www.youtube.com/watch?v=... or https://www.instagram.com/reel/..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-4 pr-32 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                />
                {detectedSource && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SOURCE_COLOURS[detectedSource]}`}>
                    {detectedSource.charAt(0).toUpperCase() + detectedSource.slice(1)}
                  </span>
                )}
              </div>
              <button
                onClick={runTranscribe}
                disabled={transcribing || !url.trim()}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {transcribing ? "Transcribing…" : "Transcribe"}
              </button>
            </div>

            <p className="text-[10px] text-gray-600">
              Supports YouTube, Instagram Reels, TikTok, and 1000+ platforms via Apify. Videos must be public.
              Processing may take 30–90 seconds.
            </p>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-800 px-3 py-2 text-xs text-red-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-900/20 border border-emerald-800 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {success}
              </div>
            )}
          </div>
        </div>

        {/* Transcript list */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Saved Transcripts ({transcripts.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : transcripts.length === 0 ? (
            <div className="text-center py-12 text-gray-600 rounded-2xl bg-gray-900 border border-gray-800">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transcripts yet</p>
              <p className="text-xs mt-1">Paste a YouTube or Instagram URL above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcripts.map((t) => {
                const isOpen     = expanded === t.id;
                const full       = fullData[t.id];
                const isAnalysing = analysing === t.id;

                return (
                  <div key={t.id} className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
                    {/* Row */}
                    <div className="flex items-center gap-3 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SOURCE_COLOURS[t.source]}`}>
                            {t.source}
                          </span>
                          {t.analysis && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-900/30 text-emerald-300 border-emerald-800/50">
                              ✓ Analysed
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {t.author && <p className="text-[10px] text-gray-500">{t.author}</p>}
                          <p className="text-[10px] text-gray-600 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(t.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => analyseTranscript(t.id)}
                          disabled={isAnalysing || !!analysing}
                          title="Analyse with OpenAI"
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-900/30 disabled:opacity-40 transition-colors"
                        >
                          {isAnalysing
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Sparkles className="h-3.5 w-3.5" />}
                          {isAnalysing ? "Analysing…" : t.analysis ? "Re-analyse" : "Analyse"}
                        </button>
                        <button
                          onClick={() => deleteTranscript(t.id)}
                          className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => expandTranscript(t.id)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isOpen && (
                      <div className="border-t border-gray-800 px-5 pb-5 pt-4 space-y-4">
                        <div>
                          <a
                            href={t.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 truncate block max-w-full"
                          >
                            {t.source_url}
                          </a>
                        </div>

                        {/* Raw transcript */}
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Raw Transcript</p>
                          {full ? (
                            <pre className="text-xs text-gray-300 bg-gray-800 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                              {full.content}
                            </pre>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading transcript…
                            </div>
                          )}
                        </div>

                        {/* OpenAI Analysis */}
                        {t.analysis && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-emerald-500 mb-2">OpenAI Analysis</p>
                            <div className="text-xs text-gray-300 bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                              {t.analysis}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

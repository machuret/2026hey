// Shared engine types — imported by both admin and user-facing pages

export type Training = {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  voice: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const VALID_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
export type VoiceName = typeof VALID_VOICES[number];

export type TranscriptSource = "youtube" | "instagram" | "tiktok" | "other";

export type Transcript = {
  id: string;
  title: string;
  author: string | null;
  source: TranscriptSource;
  source_url: string;
  analysis: string | null;
  created_at: string;
};

export type TranscriptFull = Transcript & { content: string };

export const SOURCE_COLOURS: Record<TranscriptSource, string> = {
  youtube:   "bg-red-900/30 text-red-300 border-red-800/50",
  instagram: "bg-purple-900/30 text-purple-300 border-purple-800/50",
  tiktok:    "bg-pink-900/30 text-pink-300 border-pink-800/50",
  other:     "bg-gray-800 text-gray-400 border-gray-700",
};

/** Detect transcript source from a URL — shared between edge fn logic and UI */
export function detectTranscriptSource(url: string): TranscriptSource {
  if (/youtube\.com|youtu\.be/.test(url))  return "youtube";
  if (/instagram\.com/.test(url))          return "instagram";
  if (/tiktok\.com/.test(url))             return "tiktok";
  return "other";
}

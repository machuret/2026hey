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

// ── Shared utilities for the jobs pipeline ──────────────────────────────────

/**
 * Safely extract a human-readable error message from any value.
 * Handles: Error objects, Supabase PostgrestError, plain objects, strings.
 */
export function extractErrorMsg(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  try { return JSON.stringify(err); } catch { return "Unknown error"; }
}

/**
 * Split a full name string into first name and last name.
 * Handles multi-word last names (e.g. "Jean-Pierre Van Der Berg").
 */
export function splitDmName(fullName: string | null): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  if (!fullName?.trim()) return { firstName: "", lastName: "", fullName: "" };
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    fullName: fullName.trim(),
  };
}

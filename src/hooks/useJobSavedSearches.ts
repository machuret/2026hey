"use client";

import { useState, useCallback, useEffect } from "react";
import type { SavedSearch, JobSearchForm } from "@/app/engine/jobs/types";

/** Return type of useJobSavedSearches — importable for prop types */
export type SavedSearchesHook = ReturnType<typeof useJobSavedSearches>;

export function useJobSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const fetchSearches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/engine/jobs/saved-searches", {
        signal: AbortSignal.timeout(10_000),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to load saved searches"); return; }
      setSearches(data.searches ?? []);
    } catch {
      setError("Failed to load saved searches");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { fetchSearches(); }, [fetchSearches]);

  const saveSearch = useCallback(async (name: string, form: JobSearchForm) => {
    try {
      const res = await fetch("/api/engine/jobs/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, form }),
        signal: AbortSignal.timeout(10_000),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Save failed");
      setSearches((prev) => [data.search, ...prev]);
      return data.search as SavedSearch;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      return null;
    }
  }, []);

  const deleteSearch = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/engine/jobs/saved-searches/${id}`, {
        method: "DELETE",
        signal: AbortSignal.timeout(10_000),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Delete failed");
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }, []);

  return { searches, loading, error, fetchSearches, saveSearch, deleteSearch };
}

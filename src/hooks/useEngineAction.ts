"use client";

// ═══════════════════════════════════════════════════════════════════════════
// useEngineAction — shared hook for POSTing to /api/engine/jobs/* endpoints
// with loading state, error surfacing and a free-form summary message.
//
// Extracted from StageActions so other components (e.g. SmartLeadActions) can
// reuse the exact same loading/error contract.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useState } from "react";
import { emitPipelineRefresh } from "@/app/engine/jobs/pipelineEvents";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export type EngineActionResult = Record<string, unknown> & {
  success?: boolean;
  error?: string;
  reason?: string;
};

type Options = {
  /** Absolute URL or path under /api/engine */
  url: string;
  /** HTTP method; defaults to POST */
  method?: "POST" | "GET";
  /** Timeout in ms; defaults to 295s (edge-fn max) */
  timeoutMs?: number;
  /** Callback that receives the parsed response and returns a user-visible summary */
  formatSuccess?: (data: EngineActionResult) => string;
  /** Called after a successful run — typically the stage's `refresh()` */
  onSuccess?: (data: EngineActionResult) => void;
  /** Whether to emit a pipeline refresh event on success. Defaults to true. */
  emitRefresh?: boolean;
};

export function useEngineAction({
  url,
  method      = "POST",
  timeoutMs   = 295_000,
  formatSuccess,
  onSuccess,
  emitRefresh = true,
}: Options) {
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  const run = useCallback(async (body?: unknown) => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(url, {
        method,
        headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
        body:    method === "POST" && body !== undefined ? JSON.stringify(body) : undefined,
        signal:  AbortSignal.timeout(timeoutMs),
      });

      let data: EngineActionResult;
      try {
        data = (await res.json()) as EngineActionResult;
      } catch {
        data = { error: `HTTP ${res.status}` };
      }

      if (res.status === 429) {
        setMsg(`⛔ Budget hit: ${data.reason ?? data.error}`);
        return { ok: false as const, data };
      }
      if (!res.ok || data.error || data.success === false) {
        setMsg(`⚠ ${data.error ?? data.reason ?? "Failed"}`);
        return { ok: false as const, data };
      }

      const summary = formatSuccess ? formatSuccess(data) : "✓ Done";
      setMsg(summary);
      onSuccess?.(data);
      if (emitRefresh) emitPipelineRefresh();
      return { ok: true as const, data };
    } catch (e) {
      setMsg(`⚠ ${extractErrorMsg(e)}`);
      return { ok: false as const, data: { error: extractErrorMsg(e) } };
    } finally {
      setLoading(false);
    }
  }, [url, method, timeoutMs, formatSuccess, onSuccess, emitRefresh]);

  return { run, loading, msg, setMsg };
}

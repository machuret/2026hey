// ═══════════════════════════════════════════════════════════════════════════
// Pipeline event bus — lightweight pub/sub for refresh notifications.
// After a mutating action (AutoPilot tick, bulk action, push to CRM), emit
// `pipeline:refresh` so subscribers (stage pages, nav badges) refetch.
//
// Using window events (not React context) because the layout and page trees
// are separate — context would require lifting state up, events don't.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";

export const PIPELINE_REFRESH_EVENT = "pipeline:refresh";

/** Emit a refresh notification. Safe on SSR (no-op). */
export function emitPipelineRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PIPELINE_REFRESH_EVENT));
}

/** React hook: run `callback` whenever a refresh is emitted. */
export function usePipelineRefresh(callback: () => void): void {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(PIPELINE_REFRESH_EVENT, handler);
    return () => window.removeEventListener(PIPELINE_REFRESH_EVENT, handler);
  }, [callback]);
}

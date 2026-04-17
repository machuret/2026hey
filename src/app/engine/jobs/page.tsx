"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Legacy /engine/jobs entry point.
 * Redirects to the new nested route structure, preserving any `?tab=` param
 * for back-compat with bookmarks.
 */
export default function JobsLegacyRedirect() {
  return (
    <Suspense fallback={null}>
      <RedirectInner />
    </Suspense>
  );
}

function RedirectInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const tab = params.get("tab");
    const map: Record<string, string> = {
      scrape:   "/engine/jobs/scrape",
      pending:  "/engine/jobs/pending",
      enrich:   "/engine/jobs/qualified",
      enriched: "/engine/jobs/enriched",
      review:   "/engine/jobs/review",
    };
    router.replace(map[tab ?? "scrape"] ?? "/engine/jobs/scrape");
  }, [router, params]);

  return null;
}

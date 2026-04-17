"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SCRAPED tab — everything that isn't yet "ready" (has DM) and not terminal.
// Covers pending + qualified + dead_end + stuck_no_dm in a single view.
// One unified "Enrich" button runs analyze → find-dm as needed.
// ═══════════════════════════════════════════════════════════════════════════

import StagePage from "../components/StagePage";
import { ScrapedActions } from "../components/StageActions";
import { SCRAPED_COLUMNS } from "../tableColumns";

export default function ScrapedPage() {
  return (
    <StagePage
      stage="scraped"
      title="Scraped — Awaiting Enrichment"
      description="Jobs that have been scraped but aren't ready to send yet. Click Enrich to run AI analysis and decision-maker lookup."
      columns={SCRAPED_COLUMNS}
      bulkActions={(selected, jobs, refresh) => (
        <ScrapedActions selected={selected} jobs={jobs} refresh={refresh} />
      )}
      emptyMessage="No scraped jobs awaiting enrichment. Run a scrape or check the Ready tab."
    />
  );
}

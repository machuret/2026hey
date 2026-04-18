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
      title="Scraped — Find a Decision Maker"
      description="One click runs the full pipeline: AI checks if the job is relevant, then searches for a decision maker. If we find one, the job moves to Ready. If not, you'll see why here."
      columns={SCRAPED_COLUMNS}
      bulkActions={(selected, jobs, refresh) => (
        <ScrapedActions selected={selected} jobs={jobs} refresh={refresh} />
      )}
      emptyMessage="No scraped jobs awaiting enrichment. Run a scrape or check the Ready tab."
    />
  );
}

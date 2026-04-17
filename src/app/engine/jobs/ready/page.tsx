"use client";

// ═══════════════════════════════════════════════════════════════════════════
// READY tab — jobs enriched with a decision maker. The "send" tab.
// ═══════════════════════════════════════════════════════════════════════════

import StagePage from "../components/StagePage";
import { ReadyActions } from "../components/StageActions";
import { ENRICHED_COLUMNS } from "../tableColumns";

export default function ReadyPage() {
  return (
    <StagePage
      stage="ready"
      title="Ready — Decision Maker Found"
      description="Jobs with a confirmed decision maker. Review and send to SmartLead."
      columns={ENRICHED_COLUMNS}
      bulkActions={(selected, jobs, refresh) => (
        <ReadyActions selected={selected} jobs={jobs} refresh={refresh} />
      )}
      emptyMessage="No jobs ready to send yet. Enrich scraped jobs to find decision makers."
    />
  );
}

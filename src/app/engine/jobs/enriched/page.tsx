"use client";

import StagePage from "../components/StagePage";
import { EnrichedActions } from "../components/StageActions";
import { ENRICHED_COLUMNS } from "../tableColumns";

export default function EnrichedPage() {
  return (
    <StagePage
      stage="enriched"
      title="Enriched — Decision Maker Found"
      description="Jobs with a confirmed DM (name + email or LinkedIn). Review and push to CRM."
      columns={ENRICHED_COLUMNS}
      bulkActions={(selected, jobs, refresh) => (
        <EnrichedActions selected={selected} jobs={jobs} refresh={refresh} />
      )}
      emptyMessage="No enriched jobs yet. Run DM search on qualified jobs."
    />
  );
}

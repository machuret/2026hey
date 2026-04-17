"use client";

import StagePage from "../components/StagePage";
import { ENRICHED_COLUMNS } from "../tableColumns";

export default function EnrichedPage() {
  return (
    <StagePage
      stage="enriched"
      title="Enriched — Decision Maker Found"
      description="Jobs with a confirmed DM (name + email or LinkedIn). Review and push to CRM."
      columns={ENRICHED_COLUMNS}
      emptyMessage="No enriched jobs yet. Run DM search on qualified jobs."
    />
  );
}

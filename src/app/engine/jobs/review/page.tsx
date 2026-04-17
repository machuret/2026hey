"use client";

import StagePage from "../components/StagePage";
import { REVIEW_COLUMNS } from "../tableColumns";

export default function ReviewPage() {
  return (
    <StagePage
      stage="enriched"
      title="Review — Final Check Before CRM"
      description="Human approval step. Review the AI pitch angle and decision maker info, then push to CRM."
      columns={REVIEW_COLUMNS}
      emptyMessage="Nothing to review. Enrich jobs first."
    />
  );
}

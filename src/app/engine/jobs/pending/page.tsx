"use client";

import StagePage from "../components/StagePage";
import { PENDING_COLUMNS } from "../tableColumns";

export default function PendingPage() {
  return (
    <StagePage
      stage="pending"
      title="Pending — Awaiting AI Analysis"
      description="New scraped jobs. Next step: run AI analysis to score relevance and identify internal hirings."
      columns={PENDING_COLUMNS}
      emptyMessage="No pending jobs. Scrape new jobs to get started."
    />
  );
}

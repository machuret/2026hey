"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SENT tab — terminal archive. Jobs pushed to CRM or SmartLead.
// Read-only view.
// ═══════════════════════════════════════════════════════════════════════════

import StagePage from "../components/StagePage";
import { CRM_COLUMNS } from "../tableColumns";

export default function SentPage() {
  return (
    <StagePage
      stage="sent"
      title="Sent — CRM & SmartLead"
      description="Leads already pushed to CRM or SmartLead campaigns. Archive."
      columns={CRM_COLUMNS}
      emptyMessage="Nothing sent yet."
    />
  );
}

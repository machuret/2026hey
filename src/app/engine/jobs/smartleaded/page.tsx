"use client";

import StagePage from "../components/StagePage";
import { SMARTLEAD_COLUMNS } from "../tableColumns";

export default function SmartLeadedPage() {
  return (
    <StagePage
      stage="smartleaded"
      title="In SmartLead — Archive"
      description="Leads pushed to a SmartLead cold-email campaign. Read-only."
      columns={SMARTLEAD_COLUMNS}
      emptyMessage="No leads pushed to SmartLead yet."
    />
  );
}

"use client";

import StagePage from "../components/StagePage";
import { CRM_COLUMNS } from "../tableColumns";

export default function CrmPage() {
  return (
    <StagePage
      stage="pushed"
      title="In CRM — Archive"
      description="Leads already pushed to the CRM. Read-only archive."
      columns={CRM_COLUMNS}
      emptyMessage="No leads pushed to CRM yet."
    />
  );
}

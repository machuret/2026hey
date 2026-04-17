"use client";

import StagePage from "../components/StagePage";
import { StuckActions } from "../components/StageActions";
import { STUCK_COLUMNS } from "../tableColumns";

export default function StuckPage() {
  return (
    <StagePage
      stage="stuck_no_dm"
      title="Stuck — DM Search Exhausted"
      description="AI approved but Apollo + LinkedIn couldn't find a decision maker after 3 attempts. Manual review required."
      columns={STUCK_COLUMNS}
      bulkActions={(selected, jobs, refresh) => (
        <StuckActions selected={selected} jobs={jobs} refresh={refresh} />
      )}
      emptyMessage="No stuck jobs — great!"
    />
  );
}

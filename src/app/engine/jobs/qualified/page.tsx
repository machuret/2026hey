"use client";

import StagePage from "../components/StagePage";
import { QualifiedActions } from "../components/StageActions";
import { QUALIFIED_COLUMNS } from "../tableColumns";

export default function QualifiedPage() {
  return (
    <StagePage
      stage="qualified"
      title="Qualified — Ready for DM Search"
      description="AI approved these jobs (score ≥ 6, internal poster). Next step: find the decision maker via Apollo/LinkedIn."
      columns={QUALIFIED_COLUMNS}
      bulkActions={(selected, jobs, refresh) => (
        <QualifiedActions selected={selected} jobs={jobs} refresh={refresh} />
      )}
      emptyMessage="No qualified jobs. Run AI analysis on pending jobs first."
    />
  );
}

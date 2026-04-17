"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AutoPilotV2 from "./components/AutoPilotV2";
import { usePipelineRefresh } from "./pipelineEvents";

type StageLink = {
  href: string;
  label: string;
  /** countKey matches what /api/engine/jobs/stats returns */
  stageKey: string;
};

const STAGES: StageLink[] = [
  { href: "/engine/jobs/scrape",    label: "1. Scrape",    stageKey: "scrape" },
  { href: "/engine/jobs/pending",   label: "2. Pending",   stageKey: "pending" },
  { href: "/engine/jobs/qualified", label: "3. Qualified", stageKey: "qualified" },
  { href: "/engine/jobs/enriched",  label: "4. Enriched",  stageKey: "enriched" },
  { href: "/engine/jobs/stuck",     label: "Stuck",        stageKey: "stuck_no_dm" },
  { href: "/engine/jobs/review",    label: "5. Review",    stageKey: "enriched" }, // ready subset
  { href: "/engine/jobs/crm",         label: "6. CRM",        stageKey: "pushed" },
  { href: "/engine/jobs/smartleaded", label: "7. SmartLead",  stageKey: "smartleaded" },
];

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [stats, setStats] = useState<Record<string, number>>({});

  const loadStats = useCallback(() => {
    fetch("/api/engine/jobs/stats", { signal: AbortSignal.timeout(10_000) })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.stats) setStats(d.stats); })
      .catch(() => {});
  }, []);

  // Refetch on nav AND whenever a pipeline mutation fires.
  useEffect(() => { loadStats(); }, [pathname, loadStats]);
  usePipelineRefresh(loadStats);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Job Pipeline</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Scrape → Qualify → Find DM → Review → Push to CRM
            </p>
          </div>
          <AutoPilotV2 />
        </div>

        {/* Stage nav */}
        <nav className="flex gap-1 mt-4 overflow-x-auto">
          {STAGES.map((s) => {
            const isActive = pathname === s.href;
            const count = stats[s.stageKey];
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span>{s.label}</span>
                {count != null && count > 0 && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                    isActive ? "bg-indigo-500" : "bg-gray-800"
                  }`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {children}
      </div>
    </div>
  );
}

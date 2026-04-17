"use client";

// ═══════════════════════════════════════════════════════════════════════════
// Jobs layout — simplified 3-tab flow.
//
//   Scraped → Ready → Sent
//
// Power-user pages (pending/qualified/stuck/enriched/etc.) live under
// "Advanced" which is collapsed by default.
// ═══════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";
import AutoPilotV2 from "./components/AutoPilotV2";
import { usePipelineRefresh } from "./pipelineEvents";

type StageLink = {
  href: string;
  label: string;
  /** Which stats bucket(s) feed this tab's count. Summed. */
  sumKeys: readonly string[];
};

// Primary simplified tabs
const PRIMARY: StageLink[] = [
  { href: "/engine/jobs/scrape",  label: "1. Scrape",  sumKeys: [] },
  { href: "/engine/jobs/scraped", label: "2. Scraped", sumKeys: ["pending", "qualified", "stuck_no_dm", "dead_end"] },
  { href: "/engine/jobs/ready",   label: "3. Ready",   sumKeys: ["enriched"] },
  { href: "/engine/jobs/sent",    label: "4. Sent",    sumKeys: ["pushed", "smartleaded"] },
];

// Power-user drill-down pages (hidden under "Advanced")
const ADVANCED: StageLink[] = [
  { href: "/engine/jobs/pending",     label: "Pending",     sumKeys: ["pending"] },
  { href: "/engine/jobs/qualified",   label: "Qualified",   sumKeys: ["qualified"] },
  { href: "/engine/jobs/enriched",    label: "Enriched",    sumKeys: ["enriched"] },
  { href: "/engine/jobs/stuck",       label: "Stuck",       sumKeys: ["stuck_no_dm"] },
  { href: "/engine/jobs/review",      label: "Review",      sumKeys: ["enriched"] },
  { href: "/engine/jobs/crm",         label: "CRM",         sumKeys: ["pushed"] },
  { href: "/engine/jobs/smartleaded", label: "SmartLead",   sumKeys: ["smartleaded"] },
];

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [stats, setStats] = useState<Record<string, number>>({});

  // Expand Advanced automatically if the current route is one of them
  const isOnAdvancedRoute = useMemo(
    () => ADVANCED.some((a) => pathname === a.href),
    [pathname],
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  useEffect(() => { if (isOnAdvancedRoute) setShowAdvanced(true); }, [isOnAdvancedRoute]);

  const loadStats = useCallback(() => {
    fetch("/api/engine/jobs/stats", { signal: AbortSignal.timeout(10_000) })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.stats) setStats(d.stats); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadStats(); }, [pathname, loadStats]);
  usePipelineRefresh(loadStats);

  const countFor = (keys: readonly string[]): number =>
    keys.reduce((acc, k) => acc + (stats[k] ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Job Pipeline</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Scrape → Enrich → Send
            </p>
          </div>
          <AutoPilotV2 />
        </div>

        {/* Primary nav */}
        <nav className="flex gap-1 mt-4 overflow-x-auto items-center">
          {PRIMARY.map((s) => (
            <NavLink key={s.href} s={s} active={pathname === s.href}
              count={s.sumKeys.length > 0 ? countFor(s.sumKeys) : undefined} primary />
          ))}

          <span className="mx-2 h-5 w-px bg-gray-800" aria-hidden />

          <button
            onClick={() => setShowAdvanced((x) => !x)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              showAdvanced ? "bg-gray-800 text-gray-200" : "text-gray-500 hover:text-gray-200 hover:bg-gray-800"
            }`}
            title="Power-user drill-down tabs"
          >
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Advanced
          </button>

          <Link
            href="/engine/debug"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              pathname === "/engine/debug" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-amber-300 hover:bg-gray-800"
            }`}
            title="System diagnostic snapshot"
          >
            <Bug className="h-3 w-3" />
            Debug
          </Link>
        </nav>

        {/* Advanced drill-down */}
        {showAdvanced && (
          <nav className="flex gap-1 mt-2 overflow-x-auto pl-4 border-l-2 border-gray-800 ml-1">
            {ADVANCED.map((s) => (
              <NavLink key={s.href} s={s} active={pathname === s.href}
                count={countFor(s.sumKeys)} />
            ))}
          </nav>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {children}
      </div>
    </div>
  );
}

function NavLink({ s, active, count, primary }: {
  s: StageLink; active: boolean; count?: number; primary?: boolean;
}) {
  const base = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors";
  const activeCls = primary
    ? "bg-indigo-600 text-white"
    : "bg-gray-700 text-white";
  const idle = primary
    ? "text-gray-400 hover:text-white hover:bg-gray-800"
    : "text-gray-500 hover:text-gray-200 hover:bg-gray-800";
  return (
    <Link href={s.href} className={`${base} ${active ? activeCls : idle}`}>
      <span>{s.label}</span>
      {count != null && count > 0 && (
        <span className={`rounded px-1.5 py-0.5 text-[10px] ${
          active ? (primary ? "bg-indigo-500" : "bg-gray-600") : "bg-gray-800"
        }`}>
          {count}
        </span>
      )}
    </Link>
  );
}

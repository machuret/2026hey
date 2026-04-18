"use client";

// ═══════════════════════════════════════════════════════════════════════════
// Stage-specific table column configurations.
// Each pipeline page passes its relevant column set to JobsTable.
// ═══════════════════════════════════════════════════════════════════════════

import { ExternalLink, Mail, Phone, Linkedin, AlertTriangle } from "lucide-react";
import type { JobLead } from "./types";
import { STATUS_LABELS, STATUS_COLOURS } from "./types";
import { splitDmName } from "./utils";

export type TableColumn = {
  key: string;
  header: string;
  width?: string;
  render: (job: JobLead) => React.ReactNode;
};

// ── Shared cell renderers ──────────────────────────────────────────────────

const companyCell = (job: JobLead) => (
  <div>
    <div className="font-medium text-white truncate max-w-[200px]">
      {job.company_name || "Unknown"}
    </div>
    {job.salary && <div className="text-xs text-gray-500 truncate">{job.salary}</div>}
  </div>
);

const titleCell = (job: JobLead) => (
  <div>
    <div className="text-gray-300 truncate max-w-[250px]">{job.job_title}</div>
    {job.job_url && (
      <a
        href={job.job_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="h-3 w-3" /> View
      </a>
    )}
  </div>
);

const locationCell = (job: JobLead) => (
  <div>
    <div className="truncate max-w-[140px] text-gray-400">{job.location || "—"}</div>
    {job.country && <span className="text-xs text-gray-600">{job.country}</span>}
  </div>
);

const sourceCell = (job: JobLead) => (
  <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 capitalize">
    {job.source}
  </span>
);

const statusCell = (job: JobLead) => (
  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium border ${STATUS_COLOURS[job.status] ?? "bg-gray-800"}`}>
    {STATUS_LABELS[job.status]}
  </span>
);

const aiScoreCell = (job: JobLead) => {
  const score = job.ai_relevance_score;
  if (score == null) return <span className="text-gray-600">—</span>;
  const color = score >= 8 ? "text-emerald-400" : score >= 6 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-semibold ${color}`}>{score}/10</span>;
};

// ── DM (decision maker) cells — front and center on Enriched page ─────────

const dmNameCell = (job: JobLead) => {
  if (!job.dm_name) return <span className="text-gray-600 text-xs">No DM</span>;
  const { firstName, lastName } = splitDmName(job.dm_name);
  return (
    <div>
      <div className="font-semibold text-emerald-300">{firstName} {lastName}</div>
      {job.dm_title && <div className="text-xs text-gray-400 truncate max-w-[180px]">{job.dm_title}</div>}
    </div>
  );
};

const dmEmailCell = (job: JobLead) => {
  if (!job.dm_email) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <a
      href={`mailto:${job.dm_email}`}
      className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
      onClick={(e) => e.stopPropagation()}
    >
      <Mail className="h-3 w-3" /> {job.dm_email}
    </a>
  );
};

const dmPhoneCell = (job: JobLead) => {
  const phone = job.dm_mobile || job.dm_phone;
  if (!phone) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-300">
      <Phone className="h-3 w-3" /> {phone}
    </span>
  );
};

const dmLinkedInCell = (job: JobLead) => {
  if (!job.dm_linkedin_url) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <a
      href={job.dm_linkedin_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
      onClick={(e) => e.stopPropagation()}
    >
      <Linkedin className="h-3 w-3" /> Profile
    </a>
  );
};

const listedAtCell = (job: JobLead) => {
  if (!job.listed_at) return <span className="text-gray-600 text-xs">—</span>;
  const d = new Date(job.listed_at);
  return <span className="text-xs text-gray-400">{d.toLocaleDateString()}</span>;
};

const posterTypeCell = (job: JobLead) => {
  if (!job.ai_poster_type) return <span className="text-gray-600 text-xs">—</span>;
  const isInternal = job.ai_poster_type === "direct_employer";
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
      isInternal ? "bg-emerald-900/30 text-emerald-300" : "bg-orange-900/30 text-orange-400"
    }`}>
      {isInternal ? "Internal" : "Agency"}
    </span>
  );
};

const urgencyCell = (job: JobLead) => {
  if (!job.ai_urgency) return <span className="text-gray-600 text-xs">—</span>;
  const hot = /high|urgent|asap/i.test(job.ai_urgency);
  return (
    <span className={`text-xs ${hot ? "text-red-400 font-semibold" : "text-gray-400"}`}>
      {job.ai_urgency}
    </span>
  );
};

const stuckReasonCell = (job: JobLead) => (
  <div className="flex items-center gap-1">
    <AlertTriangle className="h-3 w-3 text-orange-400" />
    <span className="text-xs text-orange-300">
      {job.dm_name ? "Partial (no contact)" : "No DM after 3 tries"}
    </span>
  </div>
);

// ── COLUMN SETS PER STAGE ──────────────────────────────────────────────────

/** Scrape results preview — jobs just scraped (pre-save or post-save, no DB IDs yet sometimes) */
export const SCRAPE_RESULTS_COLUMNS: TableColumn[] = [
  { key: "company",  header: "Company",   render: companyCell },
  { key: "title",    header: "Job Title", render: titleCell },
  { key: "location", header: "Location",  render: locationCell },
  { key: "source",   header: "Source",    render: sourceCell },
  { key: "listed",   header: "Listed",    render: listedAtCell },
];

/** Scraped — unified view across pending / qualified / stuck / dead_end.
 *
 *  ONE signal column: "Decision Maker" — answers the only question the user
 *  cares about. Green ✓ = DM found (shouldn't normally appear on /scraped
 *  since DM'd jobs move to /ready, but shown for edge cases). Otherwise
 *  shows WHY there's no DM yet, so the user knows what the pipeline thinks.
 */
export const SCRAPED_COLUMNS: TableColumn[] = [
  { key: "company",  header: "Company",  render: companyCell },
  { key: "title",    header: "Job Title", render: titleCell },
  {
    key:    "dm_status",
    header: "Decision Maker",
    width:  "180px",
    render: (j) => {
      // Has DM?
      if (j.dm_name && (j.dm_email || j.dm_linkedin_url)) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-800">
            <span>✓</span>
            <span className="truncate max-w-[120px]">{j.dm_name}</span>
          </span>
        );
      }

      // Compute WHY there's no DM yet (score is informational, not a gate)
      const analysed  = !!j.ai_enriched_at;
      const qualified = analysed && j.ai_poster_type === "direct_employer";
      const stuck     = analysed && (j.dm_attempts ?? 0) >= 3;

      if (!analysed) {
        return <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700"><span>○</span> Not analyzed yet</span>;
      }
      if (stuck) {
        return <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-orange-900/40 text-orange-300 border border-orange-800"><span>✗</span> No DM found</span>;
      }
      if (qualified) {
        return <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-indigo-900/40 text-indigo-300 border border-indigo-800"><span>…</span> Ready for DM search</span>;
      }
      // Analyzed but not qualified (low score or agency poster)
      return <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-gray-900 text-gray-500 border border-gray-800"><span>—</span> Not relevant</span>;
    },
  },
  { key: "location", header: "Location", render: locationCell },
  { key: "source",   header: "Source",   render: sourceCell },
];

/** Pending — raw scraped jobs, "should we enrich this?" */
export const PENDING_COLUMNS: TableColumn[] = [
  { key: "company",  header: "Company",  render: companyCell },
  { key: "title",    header: "Job Title", render: titleCell },
  { key: "location", header: "Location", render: locationCell },
  { key: "source",   header: "Source",   render: sourceCell },
  { key: "listed",   header: "Listed",   render: listedAtCell },
];

/** Qualified — AI approved, awaiting DM search */
export const QUALIFIED_COLUMNS: TableColumn[] = [
  { key: "company",    header: "Company",     render: companyCell },
  { key: "title",      header: "Role",        render: titleCell },
  { key: "ai_score",   header: "AI Score",    render: aiScoreCell },
  { key: "role_func",  header: "Function",    render: (j) => <span className="text-xs text-gray-400">{j.ai_role_function || "—"}</span> },
  { key: "urgency",    header: "Urgency",     render: urgencyCell },
  { key: "poster",     header: "Poster",      render: posterTypeCell },
  { key: "location",   header: "Location",    render: locationCell },
];

/** Enriched — DM found, ready for review. DM INFO IS FRONT AND CENTER. */
export const ENRICHED_COLUMNS: TableColumn[] = [
  { key: "company",   header: "Company",        render: companyCell },
  { key: "dm_name",   header: "Decision Maker", render: dmNameCell },
  { key: "dm_email",  header: "Email",          render: dmEmailCell },
  { key: "dm_phone",  header: "Phone",          render: dmPhoneCell },
  { key: "dm_li",     header: "LinkedIn",       render: dmLinkedInCell },
  { key: "ai_score",  header: "Score",          render: aiScoreCell },
  { key: "title",     header: "Role",           render: titleCell },
];

/** Stuck — no DM found after retries. Show why. */
export const STUCK_COLUMNS: TableColumn[] = [
  { key: "company",   header: "Company",     render: companyCell },
  { key: "title",     header: "Role",        render: titleCell },
  { key: "reason",    header: "Reason",      render: stuckReasonCell },
  { key: "ai_score",  header: "AI Score",    render: aiScoreCell },
  { key: "failure",   header: "Last Error",  render: (j) => <span className="text-xs text-gray-500 truncate max-w-[200px]">{j.dm_failure_reason || j.last_error || "—"}</span> },
];

/** Review — final check before CRM push. Show everything a human needs to decide. */
export const REVIEW_COLUMNS: TableColumn[] = [
  { key: "company",    header: "Company",        render: companyCell },
  { key: "dm_name",    header: "Decision Maker", render: dmNameCell },
  { key: "dm_email",   header: "Email",          render: dmEmailCell },
  { key: "ai_score",   header: "Score",          render: aiScoreCell },
  { key: "pitch",      header: "Pitch Angle",    render: (j) => <span className="text-xs text-gray-300 truncate max-w-[240px]">{j.ai_pitch_angle || "—"}</span> },
];

/** CRM — archive of pushed leads. */
export const CRM_COLUMNS: TableColumn[] = [
  { key: "company",  header: "Company",        render: companyCell },
  { key: "dm_name",  header: "Decision Maker", render: dmNameCell },
  { key: "dm_email", header: "Email",          render: dmEmailCell },
  { key: "status",   header: "Status",         render: statusCell },
  { key: "pushed",   header: "Pushed",         render: (j) => <span className="text-xs text-gray-400">{new Date(j.updated_at).toLocaleDateString()}</span> },
];

/** SmartLead — archive of leads pushed to a SmartLead campaign. */
export const SMARTLEAD_COLUMNS: TableColumn[] = [
  { key: "company",  header: "Company",        render: companyCell },
  { key: "dm_name",  header: "Decision Maker", render: dmNameCell },
  { key: "dm_email", header: "Email",          render: dmEmailCell },
  {
    key: "campaign", header: "Campaign",
    render: (j) => (
      <span className="text-xs text-purple-300 truncate max-w-[180px] block">
        {j.smartlead_campaign_name || j.smartlead_campaign_id || "—"}
      </span>
    ),
  },
  {
    key: "pushed_at", header: "Pushed",
    render: (j) => (
      <span className="text-xs text-gray-400">
        {j.smartlead_pushed_at
          ? new Date(j.smartlead_pushed_at).toLocaleDateString()
          : "—"}
      </span>
    ),
  },
];

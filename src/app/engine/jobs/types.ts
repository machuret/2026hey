// ── Shared types for the Engine Jobs pipeline ──────────────────────────────

export type JobSource = "seek" | "indeed" | "linkedin";

export type JobStatus =
  | "new"
  | "ai_enriched"
  | "dm_enriched"
  | "fully_enriched"
  | "pushed_to_crm"
  | "dismissed"
  | "recruiter_dismissed";

export type EnrichMethod = "ai" | "apollo" | "linkedin";

export type JobLead = {
  id: string;
  source_id: string;
  source: JobSource;
  job_title: string;
  job_url: string | null;
  company_name: string | null;
  company_website: string | null;
  company_industry: string | null;
  company_size: string | null;
  location: string | null;
  country: string | null;
  salary: string | null;
  work_type: string | null;
  work_arrangement: string | null;
  description: string | null;
  // Contacts from listing
  emails: string[];
  phone_numbers: string[];
  recruiter_name: string | null;
  recruiter_phone: string | null;
  recruiter_agency: string | null;
  recruiter_website: string | null;
  // AI enrichment — core
  ai_company_summary: string | null;
  ai_hiring_signal: string | null;
  ai_relevance_score: number | null;
  ai_relevance_reason: string | null;
  ai_suggested_dm_title: string | null;
  ai_enriched_at: string | null;
  // AI — recruiter classification
  ai_poster_type: string | null;
  ai_poster_reason: string | null;
  // AI — role classification
  ai_role_seniority: string | null;
  ai_role_function: string | null;
  ai_required_skills: string[];
  ai_required_experience: string | null;
  ai_required_certifications: string[];
  ai_employment_type: string | null;
  // AI — hiring intelligence
  ai_urgency: string | null;
  ai_urgency_clues: string | null;
  ai_team_size_clue: string | null;
  ai_reports_to: string | null;
  ai_company_pain_points: string | null;
  ai_work_model: string | null;
  ai_industry_vertical: string | null;
  // AI — compensation
  ai_salary_normalized: string | null;
  ai_benefits_summary: string | null;
  // AI — cold email
  ai_candidate_persona: string | null;
  ai_pitch_angle: string | null;
  ai_email_snippet: string | null;
  ai_objection_preempt: string | null;
  // DM enrichment
  dm_name: string | null;
  dm_title: string | null;
  dm_email: string | null;
  dm_phone: string | null;
  dm_mobile: string | null;
  dm_linkedin_url: string | null;
  dm_enriched_at: string | null;
  // LinkedIn company
  li_company_url: string | null;
  li_company_desc: string | null;
  li_company_size: string | null;
  li_industry: string | null;
  li_hq_location: string | null;
  li_enriched_at: string | null;
  // Meta
  status: JobStatus;
  search_query: string | null;
  listed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobSearchForm = {
  source: JobSource;
  searchTerm: string;
  location: string;
  country: string;
  maxResults: number;
  dateRange: number;
  workType: string;
};

export type JobPipelineTab = "scrape" | "enrich" | "review";

// ── Source definitions ──────────────────────────────────────────────────────

export type SourceDef = {
  id: JobSource;
  label: string;
  regions: string;
  description: string;
  fields: ("searchTerm" | "location" | "country" | "dateRange" | "workType")[];
  defaultCountry: string;
};

export const JOB_SOURCES: SourceDef[] = [
  {
    id: "seek",
    label: "Seek",
    regions: "AU / NZ",
    description: "Seek.com.au — Australia & New Zealand job listings with recruiter contact info.",
    fields: ["searchTerm", "location", "dateRange", "workType"],
    defaultCountry: "AU",
  },
  {
    id: "indeed",
    label: "Indeed",
    regions: "USA / Global",
    description: "Indeed.com — largest US job board with company info and descriptions.",
    fields: ["searchTerm", "location", "country"],
    defaultCountry: "US",
  },
  {
    id: "linkedin",
    label: "LinkedIn Jobs",
    regions: "Global",
    description: "LinkedIn job postings — professional network with company + role details.",
    fields: ["searchTerm", "location"],
    defaultCountry: "US",
  },
];

export const STATUS_COLOURS: Record<JobStatus, string> = {
  new:                  "bg-gray-800 text-gray-300 border-gray-700",
  ai_enriched:          "bg-blue-900/30 text-blue-300 border-blue-800/50",
  dm_enriched:          "bg-emerald-900/30 text-emerald-300 border-emerald-800/50",
  fully_enriched:       "bg-indigo-900/30 text-indigo-300 border-indigo-800/50",
  pushed_to_crm:        "bg-green-900/30 text-green-300 border-green-800/50",
  dismissed:            "bg-red-900/30 text-red-400 border-red-800/50",
  recruiter_dismissed:  "bg-orange-900/30 text-orange-400 border-orange-800/50",
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  new:                  "New",
  ai_enriched:          "AI Analyzed",
  dm_enriched:          "DM Found",
  fully_enriched:       "Fully Enriched",
  pushed_to_crm:        "In CRM",
  dismissed:            "Dismissed",
  recruiter_dismissed:  "Agency Post",
};

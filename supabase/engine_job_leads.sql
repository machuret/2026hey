-- ══════════════════════════════════════════════════════════════════
-- ENGINE JOB LEADS — Run in Supabase SQL editor
-- Multi-source job scraper → DM contact pipeline
-- ══════════════════════════════════════════════════════════════════

create table if not exists job_leads (
  id                uuid primary key default gen_random_uuid(),
  source_id         text not null,
  source            text not null default 'seek'
                      check (source in ('seek','indeed','linkedin')),
  job_title         text not null,
  job_url           text,
  company_name      text,
  company_website   text,
  company_industry  text,
  company_size      text,
  location          text,
  country           text,
  salary            text,
  work_type         text,
  work_arrangement  text,
  job_category      text,
  description       text,
  -- Contacts extracted from listing
  emails            text[] default '{}',
  phone_numbers     text[] default '{}',
  recruiter_name    text,
  recruiter_phone   text,
  recruiter_agency  text,
  recruiter_website text,
  -- AI enrichment (Step 1: OpenAI)
  ai_company_summary  text,
  ai_hiring_signal    text,
  ai_relevance_score  int check (ai_relevance_score between 1 and 10),
  ai_relevance_reason    text,
  ai_suggested_dm_title  text,
  ai_enriched_at         timestamptz,
  -- AI: recruiter classification
  ai_poster_type         text,
  ai_poster_reason       text,
  -- AI: role classification
  ai_role_seniority      text,
  ai_role_function       text,
  ai_required_skills     text[] default '{}',
  ai_required_experience text,
  ai_required_certifications text[] default '{}',
  ai_employment_type     text,
  -- AI: hiring intelligence
  ai_urgency             text,
  ai_urgency_clues       text,
  ai_team_size_clue      text,
  ai_reports_to          text,
  ai_company_pain_points text,
  ai_work_model          text,
  ai_industry_vertical   text,
  -- AI: compensation
  ai_salary_normalized   text,
  ai_benefits_summary    text,
  -- AI: cold email building blocks
  ai_candidate_persona   text,
  ai_pitch_angle         text,
  ai_email_snippet       text,
  ai_objection_preempt   text,
  -- DM enrichment (Step 2: Apollo)
  dm_name             text,
  dm_title            text,
  dm_email            text,
  dm_phone            text,
  dm_mobile           text,
  dm_linkedin_url     text,
  dm_enriched_at      timestamptz,
  -- LinkedIn company enrichment (Step 3)
  li_company_url      text,
  li_company_desc     text,
  li_company_size     text,
  li_industry         text,
  li_hq_location      text,
  li_enriched_at      timestamptz,
  -- Status & meta
  status            text default 'new'
                      check (status in ('new','ai_enriched','dm_enriched','fully_enriched','pushed_to_crm','dismissed','recruiter_dismissed')),
  search_query      text,
  listed_at         timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique (source, source_id)
);

alter table job_leads enable row level security;

create policy "service role full access on job_leads"
  on job_leads using (true) with check (true);

create index if not exists job_leads_status_idx  on job_leads (status);
create index if not exists job_leads_source_idx  on job_leads (source);
create index if not exists job_leads_company_idx on job_leads (company_name);
create index if not exists job_leads_country_idx on job_leads (country);
create index if not exists job_leads_created_idx  on job_leads (created_at desc);
create index if not exists job_leads_category_idx on job_leads (job_category);

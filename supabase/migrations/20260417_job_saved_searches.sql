-- Saved search templates for the job scraper
create table if not exists job_saved_searches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  form_data   jsonb not null,
  created_at  timestamptz default now()
);

create index if not exists job_saved_searches_name_idx on job_saved_searches (name);

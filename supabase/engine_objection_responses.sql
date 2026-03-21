-- ══════════════════════════════════════════════════════════════════
-- ENGINE OBJECTION RESPONSES — Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════════

create table if not exists engine_objection_responses (
  id           uuid primary key default gen_random_uuid(),
  objection_id uuid not null references engine_objections(id) on delete cascade,
  body         text not null,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table engine_objection_responses enable row level security;

create policy "service role full access on engine_objection_responses"
  on engine_objection_responses using (true) with check (true);

create policy "anon read engine_objection_responses"
  on engine_objection_responses for select using (true);

create index if not exists engine_objection_responses_objection_idx
  on engine_objection_responses (objection_id, sort_order asc);

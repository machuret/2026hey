-- ══════════════════════════════════════════════════════════════════
-- ENGINE OBJECTIONS LIBRARY — Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════════

create table if not exists engine_objections (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table engine_objections enable row level security;

create policy "service role full access on engine_objections"
  on engine_objections using (true) with check (true);

create index if not exists engine_objections_sort_idx on engine_objections (sort_order asc);

-- Pre-load the 15 standard cold-call objections
insert into engine_objections (label, sort_order) values
  ('I''m not interested',             0),
  ('I don''t have time',              1),
  ('Just send me an email',           2),
  ('Call me back in 3 months',        3),
  ('How did you get my number?',      4),
  ('Who are you / what is this?',     5),
  ('I''m not the right person',       6),
  ('We don''t take cold calls',       7),
  ('We already have something',       8),
  ('We''re locked in a contract',     9),
  ('We tried this — it didn''t work', 10),
  ('We don''t have budget',           11),
  ('Now''s not a good time',          12),
  ('Never heard of your company',     13),
  ('What is this even about?',        14);

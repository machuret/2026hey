-- ══════════════════════════════════════════════════════════════════
-- ENGINE TRAININGS — Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════════

create table if not exists engine_trainings (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  prompt      text not null,
  voice       text not null default 'alloy'
                check (voice in ('alloy','echo','fable','onyx','nova','shimmer')),
  is_active   boolean not null default true,
  sort_order  int     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table engine_trainings enable row level security;

create policy "service role full access on engine_trainings"
  on engine_trainings using (true) with check (true);

create index if not exists engine_trainings_active_idx on engine_trainings (is_active, sort_order);

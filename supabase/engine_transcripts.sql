-- ══════════════════════════════════════════════════════════════════
-- ENGINE TRANSCRIPTS — Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════════

create table if not exists engine_transcripts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  author      text,
  source      text not null check (source in ('youtube','instagram','tiktok','other')),
  source_url  text not null,
  content     text not null,
  analysis    text,
  created_at  timestamptz not null default now()
);

alter table engine_transcripts enable row level security;

create policy "service role full access on engine_transcripts"
  on engine_transcripts using (true) with check (true);

create index if not exists engine_transcripts_source_idx on engine_transcripts (source);
create index if not exists engine_transcripts_created_idx on engine_transcripts (created_at desc);

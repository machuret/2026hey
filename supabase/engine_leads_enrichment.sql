-- ══════════════════════════════════════════════════════════════════
-- ENGINE LEADS ENRICHMENT — Run in Supabase SQL editor
-- Adds AI scoring + enrichment columns to crm_leads
-- ══════════════════════════════════════════════════════════════════

alter table crm_leads
  add column if not exists tags          text[]       default '{}',
  add column if not exists ai_score      int          check (ai_score between 1 and 10),
  add column if not exists ai_score_reason text,
  add column if not exists ai_signals    text[]       default '{}',
  add column if not exists enriched_at   timestamptz,
  add column if not exists call_opener   text;

create index if not exists crm_leads_ai_score_idx on crm_leads (ai_score desc nulls last);
create index if not exists crm_leads_tags_idx     on crm_leads using gin (tags);

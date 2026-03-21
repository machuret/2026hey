-- ══════════════════════════════════════════════════════════════════
-- ENGINE SCHEMA — Cold Calling Operations Platform
-- Run this in your Supabase SQL editor
-- ══════════════════════════════════════════════════════════════════

-- ─── 1. CRM Leads ────────────────────────────────────────────────

create table if not exists crm_leads (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text,
  phone           text,
  company         text,
  industry        text,
  website         text,
  pipeline_stage  text not null default 'new'
                    check (pipeline_stage in ('new','contacted','follow_up','negotiation','closed_won','closed_lost')),
  tags            text[]   default '{}',
  notes           text,
  last_called_at  timestamptz,
  next_task_at    timestamptz,
  next_task_note  text,
  source          text     default 'manual'
                    check (source in ('manual','scraper','import')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table crm_leads enable row level security;

create policy "service role full access on crm_leads"
  on crm_leads using (true) with check (true);

create index if not exists crm_leads_stage_idx on crm_leads (pipeline_stage);
create index if not exists crm_leads_created_idx on crm_leads (created_at desc);

-- ─── 2. CRM Call History ─────────────────────────────────────────

create table if not exists crm_call_history (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references crm_leads (id) on delete cascade,
  called_at        timestamptz not null default now(),
  duration_seconds int,
  outcome          text check (outcome in ('no_answer','voicemail','callback','not_interested','interested','closed')),
  notes            text,
  created_at       timestamptz not null default now()
);

alter table crm_call_history enable row level security;

create policy "service role full access on crm_call_history"
  on crm_call_history using (true) with check (true);

create index if not exists crm_call_history_lead_idx on crm_call_history (lead_id);

-- ─── 3. Call Flow Trees ──────────────────────────────────────────

create table if not exists call_flow_trees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  industry    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table call_flow_trees enable row level security;

create policy "service role full access on call_flow_trees"
  on call_flow_trees using (true) with check (true);

-- ─── 4. Call Flow Nodes ──────────────────────────────────────────

create table if not exists call_flow_nodes (
  id          uuid primary key default gen_random_uuid(),
  tree_id     uuid not null references call_flow_trees (id) on delete cascade,
  parent_id   uuid references call_flow_nodes (id) on delete cascade,
  node_type   text not null check (node_type in ('stage','objection','response')),
  label       text not null,
  script      text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table call_flow_nodes enable row level security;

create policy "service role full access on call_flow_nodes"
  on call_flow_nodes using (true) with check (true);

create index if not exists call_flow_nodes_tree_idx   on call_flow_nodes (tree_id);
create index if not exists call_flow_nodes_parent_idx on call_flow_nodes (parent_id);

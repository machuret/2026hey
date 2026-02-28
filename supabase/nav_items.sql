-- ══════════════════════════════════════════════════════
-- NAV ITEMS TABLE — CMS for header navigation
-- Run this in your Supabase SQL editor
-- ══════════════════════════════════════════════════════

create table if not exists nav_items (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  href text not null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  is_cta boolean not null default false,
  open_new_tab boolean not null default false,
  updated_at timestamptz default now()
);

create or replace function update_nav_items_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger nav_items_updated
  before update on nav_items
  for each row execute function update_nav_items_updated_at();

alter table nav_items enable row level security;

create policy "public read nav_items" on nav_items for select using (true);
create policy "service role all nav_items" on nav_items using (auth.role() = 'service_role');

-- ══════════════════════════════════════════════════════
-- SEED: DEFAULT NAV ITEMS
-- ══════════════════════════════════════════════════════
insert into nav_items (label, href, sort_order, visible, is_cta, open_new_tab) values
('Services',        '/#services',          1,  true,  false, false),
('Voicemail Drops', '/ringless-voicemail', 2,  true,  false, false),
('WhatsApp AI',     '/whatsapp-agent',     3,  true,  false, false),
('Packages',        '/packages',           4,  true,  false, false),
('Case Studies',    '/case-studies',       5,  true,  false, false),
('About',           '/about',              6,  true,  false, false),
('Get Started',     '/contact',            7,  true,  true,  false)

on conflict do nothing;

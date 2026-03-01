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
('About',           '/about',              1,  true,  false, false),
('Services',        '/#services',          2,  true,  false, false),
('Voicemail Drops', '/ringless-voicemail', 3,  true,  false, false),
('WhatsApp Agent',  '/whatsapp-agent',     4,  true,  false, false),
('Packages',        '/packages',           5,  true,  false, false),
('Case Studies',    '/case-studies',       6,  true,  false, false),
('Get Started',     '/contact',            7,  true,  true,  false)

on conflict do nothing;

-- ══════════════════════════════════════════════════════
-- UPDATE: Re-order and relabel existing rows
-- Run this if the table was already seeded
-- ══════════════════════════════════════════════════════
update nav_items set label = 'About',          href = '/about',              sort_order = 1 where href = '/about';
update nav_items set label = 'Services',       href = '/#services',          sort_order = 2 where href = '/#services';
update nav_items set label = 'Voicemail Drops',href = '/ringless-voicemail', sort_order = 3 where href = '/ringless-voicemail';
update nav_items set label = 'WhatsApp Agent', href = '/whatsapp-agent',     sort_order = 4 where href = '/whatsapp-agent';
update nav_items set label = 'Packages',       href = '/packages',           sort_order = 5 where href = '/packages';
update nav_items set label = 'Case Studies',   href = '/case-studies',       sort_order = 6 where href = '/case-studies';
update nav_items set label = 'Get Started',    href = '/contact',            sort_order = 7 where href = '/contact';

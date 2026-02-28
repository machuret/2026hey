-- ══════════════════════════════════════════════════════
-- SEO META TABLE — per-page title and description
-- Run this in your Supabase SQL editor
-- ══════════════════════════════════════════════════════

create table if not exists seo_meta (
  id uuid default gen_random_uuid() primary key,
  page text not null unique,
  title text not null,
  description text not null,
  updated_at timestamptz default now()
);

create or replace function update_seo_meta_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger seo_meta_updated
  before update on seo_meta
  for each row execute function update_seo_meta_updated_at();

alter table seo_meta enable row level security;

create policy "public read seo_meta" on seo_meta for select using (true);
create policy "service role all seo_meta" on seo_meta using (auth.role() = 'service_role');

-- ══════════════════════════════════════════════════════
-- SEED: DEFAULT SEO PER PAGE
-- ══════════════════════════════════════════════════════
insert into seo_meta (page, title, description) values
('home',              'Hey More Leads — More Conversations. More Closings. More Revenue.', 'Done-For-You Lead Generation. No Cold Calls. No Ad Spend. Ringless Voicemail Drops + AI WhatsApp Agents to fill your pipeline with appointment-ready prospects.'),
('about',             'About Hey More Leads — Who We Are & Why We Built This', 'We built Hey More Leads because the old lead generation playbook is broken. Learn who we are, what we believe, and how we work.'),
('whatsapp-agent',    'AI WhatsApp Agent — 24/7 Lead Qualification on Autopilot | Hey More Leads', 'Our AI-powered WhatsApp Agent engages, qualifies, and books appointments from your leads automatically — 24 hours a day, 7 days a week.'),
('ringless-voicemail','Ringless Voicemail Drops — Reach Prospects Without Calling | Hey More Leads', 'Drop your voice message directly into voicemail inboxes without the phone ever ringing. High listen rates, zero interruptions.'),
('packages',          'Packages & Pricing — Hey More Leads', 'Transparent, results-focused packages for businesses ready to fill their pipeline with appointment-ready prospects using Ringless Voicemail and WhatsApp AI.'),
('case-studies',      'Case Studies — Real Campaigns, Real Results | Hey More Leads', 'See actual campaigns we have run — the situation, what we built, and exactly what happened. No vague claims, no cherry-picked metrics.'),
('contact',           'Book a Free Strategy Call — Hey More Leads', 'Ready to start getting leads? Book a free strategy call and we will show you exactly how to put our system to work for your business in days, not months.')

on conflict (page) do update set title = excluded.title, description = excluded.description;

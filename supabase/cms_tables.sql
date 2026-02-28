-- ══════════════════════════════════════════════════════
-- HEY MORE LEADS — CMS TABLES
-- Run this in your Supabase SQL editor
-- ══════════════════════════════════════════════════════

-- ── CASE STUDIES ──────────────────────────────────────
create table if not exists case_studies (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('rvm', 'wa')),
  industry text not null,
  client_name text not null,
  client_detail text not null,
  data_industry text not null,
  stat1_num text not null,
  stat1_label text not null,
  stat2_num text not null,
  stat2_label text not null,
  situation text not null,
  challenges text[] not null default '{}',
  what_we_did jsonb not null default '[]',
  results_title text not null,
  results jsonb not null default '[]',
  quote text not null,
  quote_attr text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── TESTIMONIALS ──────────────────────────────────────
create table if not exists testimonials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  quote text not null,
  service text not null check (service in ('rvm', 'wa', 'general')),
  accent_white boolean not null default false,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── PACKAGES ──────────────────────────────────────────
create table if not exists packages (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  tagline text not null,
  description text not null,
  price int not null,
  color text not null,
  badge text,
  featured boolean not null default false,
  features text[] not null default '{}',
  limits jsonb not null default '[]',
  quote text,
  cta_label text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── TEAM MEMBERS ──────────────────────────────────────
create table if not exists team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  bio text not null,
  emoji text not null default '👤',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── UPDATE TIMESTAMP TRIGGER ──────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger case_studies_updated before update on case_studies for each row execute function update_updated_at();
create trigger testimonials_updated before update on testimonials for each row execute function update_updated_at();
create trigger packages_updated before update on packages for each row execute function update_updated_at();
create trigger team_members_updated before update on team_members for each row execute function update_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────
alter table case_studies enable row level security;
alter table testimonials enable row level security;
alter table packages enable row level security;
alter table team_members enable row level security;

-- Public read (published only)
create policy "public read case_studies" on case_studies for select using (published = true);
create policy "public read testimonials" on testimonials for select using (published = true);
create policy "public read packages" on packages for select using (published = true);
create policy "public read team_members" on team_members for select using (published = true);

-- Service role has full access (used by admin API routes with service key)
create policy "service role all case_studies" on case_studies using (auth.role() = 'service_role');
create policy "service role all testimonials" on testimonials using (auth.role() = 'service_role');
create policy "service role all packages" on packages using (auth.role() = 'service_role');
create policy "service role all team_members" on team_members using (auth.role() = 'service_role');

-- ── SEED: PACKAGES ────────────────────────────────────
insert into packages (slug, name, tagline, description, price, color, badge, featured, features, limits, quote, cta_label, sort_order) values
(
  'the-drop',
  'The Drop',
  'Ringless Voicemail',
  'Reach thousands of targeted prospects with your voice — without a single cold call.',
  1200,
  '#FF5C00',
  null,
  false,
  array[
    'Voicemail script writing & production',
    'Contact list targeting & segmentation',
    'Full campaign setup & scheduling',
    'Platform management — zero tech work for you',
    'Weekly campaign monitoring & adjustment',
    'Monthly performance report & strategy review'
  ],
  '[{"label":"Voicemail drops / month","value":"Up to 3,000","highlight":true},{"label":"Active campaigns","value":"Up to 2","highlight":false},{"label":"Script variations","value":"Up to 3","highlight":false},{"label":"Onboarding time","value":"5–7 business days","highlight":false}]'::jsonb,
  'Warm prospects calling you back — already familiar with your name, your voice, and your offer.',
  'Start With The Drop →',
  1
),
(
  'the-full-stack',
  'The Full Stack',
  'RVM + AI WhatsApp',
  'The complete done-for-you lead engine. Outreach + qualification running 24/7.',
  1800,
  '#FF5C00',
  '★ Most Popular — Best Value',
  true,
  array[
    'Full RVM campaign setup & management',
    'Custom AI WhatsApp agent — built for your business',
    'Unified strategy across both channels',
    'Priority onboarding & setup',
    'Dedicated account manager',
    'CRM & calendar integration',
    'Monthly strategy review call (1-on-1)',
    'Bi-weekly performance reporting'
  ],
  '[{"label":"Voicemail drops / month","value":"Up to 5,000","highlight":true},{"label":"WhatsApp conversations","value":"Unlimited","highlight":true},{"label":"Active RVM campaigns","value":"Up to 4","highlight":false},{"label":"Onboarding time","value":"3–5 business days","highlight":false}]'::jsonb,
  'A complete outbound-to-qualified-lead pipeline. RVM gets you heard. WhatsApp converts the conversation. You close the deal.',
  'Get The Full Stack →',
  2
),
(
  'the-agent',
  'The Agent',
  'AI WhatsApp Agent',
  'Your AI-powered qualification machine — engaging, filtering, and delivering leads around the clock.',
  1200,
  '#25D366',
  null,
  false,
  array[
    'Custom AI WhatsApp agent — built to your brief',
    'Qualification flow design & conversation scripting',
    'Custom criteria — only your ideal clients get through',
    'CRM & calendar integration for auto-booking',
    'Ongoing agent monitoring & optimisation',
    'Monthly performance report & flow refinement'
  ],
  '[{"label":"WhatsApp conversations","value":"Unlimited","highlight":true},{"label":"Qualification flows","value":"Up to 3","highlight":false},{"label":"Integrations","value":"CRM + Calendar","highlight":false},{"label":"Onboarding time","value":"5–7 business days","highlight":false}]'::jsonb,
  'Never miss a lead. Never let a hot prospect go cold. Your agent works every hour you don''t.',
  'Deploy My Agent →',
  3
);

-- ── SEED: TESTIMONIALS ────────────────────────────────
insert into testimonials (name, role, quote, service, accent_white, sort_order) values
('Daniel K.', 'Managing Partner — Meridian Property Group, Phoenix AZ', 'The first week I thought something was wrong — my phone wouldn''t stop ringing. We booked 11 appointments before we''d even finished the campaign. The cost per lead dropped by 75% compared to what we were spending on ads.', 'rvm', false, 1),
('Marcus W.', 'Owner — Crestline Roofing Co., Denver CO', 'I was sceptical because I''d never done anything like this before. Within 10 days I had more booked inspections than in the previous 3 months combined. We had to bring in an extra crew member just to keep up with the work.', 'rvm', true, 2),
('Yolanda F.', 'Director — Apex Financial Solutions, Dallas TX', 'We went from 3 leads a week to 27 in the first month. The callbacks were warm — these people already knew who we were. Closing felt easier because they called us, not the other way around.', 'rvm', false, 3),
('Priya S.', 'Head of Sales — Ascend Business Academy', 'Our sales team used to dread Monday mornings — half their calls were with people who had no business being on the call. Now every call is with someone who''s already been through the filter. Close rates went up 40%.', 'wa', false, 4),
('Tom R.', 'Founder — Stackframe Studio, Austin TX', 'We used to lose leads constantly — someone would message on a Friday night and by Monday they''d gone with someone else. Now the agent picks it up in seconds, qualifies them, and books the call.', 'wa', true, 5);

-- ── SEED: TEAM MEMBERS ────────────────────────────────
insert into team_members (name, role, bio, emoji, sort_order) values
('Gabriel M.', 'Founder & Strategy Lead', 'Spent 8 years running outbound campaigns for B2B businesses before building Hey More Leads. Has personally managed over 4 million voicemail drops and seen firsthand what separates campaigns that flood your pipeline from ones that cost you money. Obsessed with the gap between outreach volume and conversion quality.', '🎯', 1),
('James T.', 'Head of AI & Automation', 'Builds and deploys every WhatsApp AI agent we run. Background in conversational AI and sales automation — previously built qualification systems for high-ticket coaching businesses. If a conversation can be improved, James has already thought about how.', '🤖', 2),
('Sofia R.', 'Campaign Manager & Copywriter', 'Writes every voicemail script we produce and manages the ongoing performance of all active RVM campaigns. Former direct-response copywriter who pivoted to voice when she realised the medium was wildly underused. Responsible for callback rates that regularly hit 2–3x the industry average.', '✍️', 3);

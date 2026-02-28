-- ══════════════════════════════════════════════════════
-- LEADS TABLE MIGRATION — add new fields from contact form
-- Run this in your Supabase SQL editor AFTER leads_table.sql
-- ══════════════════════════════════════════════════════

alter table leads
  add column if not exists phone text,
  add column if not exists business text,
  add column if not exists industry text,
  add column if not exists package text,
  add column if not exists message text,
  add column if not exists status text not null default 'new';

-- Allow admin API (service role) to do everything
create policy "Allow service role all on leads" on leads
  using (auth.role() = 'service_role');

-- Allow anon to update status (used by admin cookie-based auth)
-- NOTE: In production, use SUPABASE_SERVICE_ROLE_KEY instead of anon key for admin routes

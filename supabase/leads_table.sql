-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/uerbrkxowbrqadkwbqea/sql

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  whatsapp text,
  business_type text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table leads enable row level security;

-- Allow inserts from anon (public form submissions)
create policy "Allow public inserts" on leads
  for insert to anon
  with check (true);

-- Only allow authenticated users (you) to read leads
create policy "Allow authenticated reads" on leads
  for select to authenticated
  using (true);

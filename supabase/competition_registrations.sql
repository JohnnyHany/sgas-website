-- Competition registrations. Run once in the Supabase SQL Editor.
create table if not exists public.competition_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  team_name text not null,
  team_university text not null,
  member_count int not null check (member_count between 2 and 4),
  members jsonb not null
);

-- RLS on with NO policies: the public anon key cannot read or write this table.
-- Only the server (service-role key) can access it.
alter table public.competition_registrations enable row level security;
revoke all on public.competition_registrations from anon, authenticated;

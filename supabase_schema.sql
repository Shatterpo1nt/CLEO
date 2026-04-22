-- Cléo Supabase schema with row-level security

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text,
  key_value text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.key_locations (
  id uuid primary key default gen_random_uuid(),
  key_id uuid not null references public.keys(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  recorded_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  key_id uuid references public.keys(id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  key_id uuid references public.keys(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.keys enable row level security;
alter table public.key_locations enable row level security;
alter table public.requests enable row level security;
alter table public.access_logs enable row level security;

revoke all on public.key_locations from anon, authenticated;
grant select on public.key_locations to service_role;

revoke all on public.access_logs from anon, authenticated;
grant insert on public.access_logs to service_role;
revoke delete on public.access_logs from anon, authenticated, service_role;

-- users: authenticated users can only read/update their own row
create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- keys: users can only read their own keys
create policy "keys_select_own"
  on public.keys
  for select
  to authenticated
  using (auth.uid() = user_id);

-- requests: users can insert and read only their own requests
create policy "requests_insert_own"
  on public.requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "requests_select_own"
  on public.requests
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "key_locations_service_role_select"
  on public.key_locations
  for select
  to service_role
  using (true);

create policy "access_logs_service_role_insert"
  on public.access_logs
  for insert
  to service_role
  with check (true);

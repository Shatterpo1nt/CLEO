-- ============================================================
-- Cléo – Supabase SQL Schema with Row-Level Security (RLS)
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: users
-- Mirrors auth.users; one row per authenticated user.
-- ============================================================
create table if not exists public.users (
    id          uuid        primary key references auth.users (id) on delete cascade,
    email       text        not null unique,
    full_name   text,
    avatar_url  text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

alter table public.users enable row level security;

-- Authenticated user can read their own row only
create policy "users: select own row"
    on public.users
    for select
    to authenticated
    using (auth.uid() = id);

-- Authenticated user can update their own row only
create policy "users: update own row"
    on public.users
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- ============================================================
-- TABLE: keys
-- Represents API / access keys owned by a user.
-- ============================================================
create table if not exists public.keys (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references public.users (id) on delete cascade,
    name        text        not null,
    key_hash    text        not null unique,
    is_active   boolean     not null default true,
    expires_at  timestamptz,
    created_at  timestamptz not null default now()
);

alter table public.keys enable row level security;

-- User can read their own keys only
create policy "keys: select own keys"
    on public.keys
    for select
    to authenticated
    using (auth.uid() = user_id);

-- ============================================================
-- TABLE: key_locations
-- Sensitive location data bound to a key.
-- Client access is entirely prohibited; service role only.
-- ============================================================
create table if not exists public.key_locations (
    id          uuid        primary key default gen_random_uuid(),
    key_id      uuid        not null references public.keys (id) on delete cascade,
    latitude    numeric(10, 7) not null,
    longitude   numeric(10, 7) not null,
    recorded_at timestamptz not null default now()
);

alter table public.key_locations enable row level security;

-- No client-side access at all: no policies are granted to
-- `authenticated` or `anon` roles.  The service_role bypasses
-- RLS by default, giving it exclusive access.

-- ============================================================
-- TABLE: requests
-- User-submitted requests (e.g. access requests).
-- ============================================================
create table if not exists public.requests (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references public.users (id) on delete cascade,
    key_id      uuid        references public.keys (id) on delete set null,
    status      text        not null default 'pending'
                            check (status in ('pending', 'approved', 'denied')),
    notes       text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

alter table public.requests enable row level security;

-- User can insert their own requests only
create policy "requests: insert own requests"
    on public.requests
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- User can read their own requests only
create policy "requests: select own requests"
    on public.requests
    for select
    to authenticated
    using (auth.uid() = user_id);

-- ============================================================
-- TABLE: access_logs
-- Immutable audit log.
-- Insert via service role only; no deletes allowed by anyone.
-- ============================================================
create table if not exists public.access_logs (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        references public.users (id) on delete set null,
    key_id      uuid        references public.keys (id) on delete set null,
    request_id  uuid        references public.requests (id) on delete set null,
    action      text        not null,
    ip_address  inet,
    metadata    jsonb,
    logged_at   timestamptz not null default now()
);

alter table public.access_logs enable row level security;

-- No insert policy for `authenticated` or `anon` roles;
-- service_role bypasses RLS and is the only writer.
-- No delete policy is defined for any role, preventing deletions
-- via the client API.  The service_role must use a direct DB
-- connection (bypassing RLS) for any maintenance deletes.

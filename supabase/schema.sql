-- ============================================================
-- CLÉO — Schéma Supabase
-- Colle ce SQL dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- 1. PROFILES (étend auth.users)
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  phone       text,
  address     text,
  created_at  timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. SUBSCRIPTIONS
create table public.subscriptions (
  id                     uuid default gen_random_uuid() primary key,
  user_id                uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  stripe_price_id        text,
  plan                   text check (plan in ('monthly', 'annual')),
  status                 text check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')) default 'incomplete',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz default now() not null,
  updated_at             timestamptz default now() not null
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- 3. KEY SLOTS
create table public.key_slots (
  id          uuid default gen_random_uuid() primary key,
  slot_number integer unique not null,
  user_id     uuid references public.profiles(id),
  label       text,           -- libellé défini par l'utilisateur
  assigned_at timestamptz,
  returned_at timestamptz,
  notes       text,
  created_at  timestamptz default now() not null
);

alter table public.key_slots enable row level security;

create policy "Users can view own key slots"
  on public.key_slots for select
  using (auth.uid() = user_id);

-- Pré-remplir 50 emplacements de clés
insert into public.key_slots (slot_number)
select generate_series(1, 50);

-- 4. TRIGGER — créer un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. FUNCTION — updated_at automatique
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

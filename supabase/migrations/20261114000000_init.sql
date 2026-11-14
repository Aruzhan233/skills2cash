-- Skills2Cash schema (documentation §11, extended).
-- Every user-owned row carries user_id = auth.uid(); Row Level Security
-- restricts all reads and writes to the owner. Catalog tables (assignments,
-- roleplay_scenarios) are read-only for signed-in users and seeded in
-- 20261114000100_seed.sql. Prompts and full rubrics live in version-controlled
-- source (src/lib) and are referenced here by key.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  age_range text check (age_range in ('25-34', '35-45', 'other')),
  weekly_time_available integer check (weekly_time_available between 1 and 80),
  experience_summary text check (char_length(experience_summary) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- skill_profiles: one active assessment result per user ----------------------
create table if not exists public.skill_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  assessment jsonb not null,                       -- questionnaire answers incl. self-ratings
  result jsonb not null,                           -- validated AI (or labelled sample) output
  selected_skill text not null check (char_length(selected_skill) between 1 and 120),
  selected_service_direction jsonb not null,
  direction_edited boolean not null default false,
  rejected_strengths jsonb not null default '[]'::jsonb,
  generated_by text not null default 'ai' check (generated_by in ('ai', 'sample')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skill_profiles_user_unique unique (user_id)
);

-- learning_paths: one active path per user ------------------------------------
create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  skill_profile_id uuid references public.skill_profiles (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  status text not null default 'active' check (status in ('active', 'completed')),
  current_stage text not null default 'discover'
    check (current_stage in ('discover', 'build', 'price', 'practice', 'launch')),
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_paths_user_unique unique (user_id)
);

-- service_offers: one editable offer per user --------------------------------
create table if not exists public.service_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  price_amount numeric(10, 2) not null check (price_amount > 0 and price_amount < 1000000),
  data jsonb not null,                              -- full Service Offer Canvas (validated by Zod)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_offers_user_unique unique (user_id)
);

-- pricing_worksheets: effort, costs and three packages ------------------------
create table if not exists public.pricing_worksheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_worksheets_user_unique unique (user_id)
);

-- assignments: mission catalog (public read) ----------------------------------
create table if not exists public.assignments (
  key text primary key check (char_length(key) <= 60),
  order_index integer not null,
  stage text not null check (stage in ('discover', 'build', 'price', 'practice', 'launch')),
  title text not null,
  description text not null,
  competencies text[] not null default '{}',
  rubric jsonb not null
);

-- assignment_submissions --------------------------------------------------------
create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  assignment_key text not null references public.assignments (key),
  submission_text text not null check (char_length(submission_text) between 1 and 3000),
  ai_feedback jsonb not null,
  score integer check (score between 0 and 100),
  status text not null default 'evaluated' check (status in ('evaluated')),
  created_at timestamptz not null default now()
);
create index if not exists assignment_submissions_user_idx
  on public.assignment_submissions (user_id, assignment_key, created_at);

-- roleplay_scenarios: scenario catalog (public read) ---------------------------
create table if not exists public.roleplay_scenarios (
  key text primary key check (char_length(key) <= 60),
  title text not null,
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  objection text not null,
  goal text not null,
  focus_dimensions text[] not null default '{}',
  is_active boolean not null default true
);

-- roleplay_sessions -----------------------------------------------------------
create table if not exists public.roleplay_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scenario_key text not null references public.roleplay_scenarios (key),
  service_offer_snapshot jsonb not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  is_scripted boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  evaluation jsonb,
  overall_score integer check (overall_score between 0 and 100),
  constraint completed_has_end check (status = 'active' or ended_at is not null)
);
create index if not exists roleplay_sessions_user_idx
  on public.roleplay_sessions (user_id, started_at);

-- roleplay_messages -----------------------------------------------------------
create table if not exists public.roleplay_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.roleplay_sessions (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'client')),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists roleplay_messages_session_idx
  on public.roleplay_messages (session_id, created_at);

-- readiness_snapshots ---------------------------------------------------------
create table if not exists public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  overall_score integer check (overall_score between 0 and 100),
  dimension_scores jsonb not null,
  evidence_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists readiness_snapshots_user_idx
  on public.readiness_snapshots (user_id, created_at);

-- updated_at triggers ---------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profiles', 'skill_profiles', 'learning_paths', 'service_offers', 'pricing_worksheets']
  loop
    execute format('drop trigger if exists %1$s_updated_at on public.%1$s', t);
    execute format('create trigger %1$s_updated_at before update on public.%1$s for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Row Level Security ----------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.skill_profiles enable row level security;
alter table public.learning_paths enable row level security;
alter table public.service_offers enable row level security;
alter table public.pricing_worksheets enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.roleplay_scenarios enable row level security;
alter table public.roleplay_sessions enable row level security;
alter table public.roleplay_messages enable row level security;
alter table public.readiness_snapshots enable row level security;

-- catalogs: read-only for signed-in users (no write policies => no writes)
drop policy if exists "assignments_read" on public.assignments;
create policy "assignments_read" on public.assignments for select to authenticated using (true);
drop policy if exists "scenarios_read" on public.roleplay_scenarios;
create policy "scenarios_read" on public.roleplay_scenarios for select to authenticated using (is_active);

-- profiles: owner = id
drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- single-row-per-user tables: full owner access
do $$
declare t text;
begin
  foreach t in array array['skill_profiles', 'learning_paths', 'service_offers', 'pricing_worksheets']
  loop
    execute format('drop policy if exists "%1$s_owner_all" on public.%1$s', t);
    execute format(
      'create policy "%1$s_owner_all" on public.%1$s for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t);
  end loop;
end $$;

-- evidence tables: owner can read, insert and delete (no edits of past evidence)
do $$
declare t text;
begin
  foreach t in array array['assignment_submissions', 'readiness_snapshots', 'roleplay_messages', 'roleplay_sessions']
  loop
    execute format('drop policy if exists "%1$s_owner_select" on public.%1$s', t);
    execute format('create policy "%1$s_owner_select" on public.%1$s for select to authenticated using (user_id = auth.uid())', t);
    execute format('drop policy if exists "%1$s_owner_delete" on public.%1$s', t);
    execute format('create policy "%1$s_owner_delete" on public.%1$s for delete to authenticated using (user_id = auth.uid())', t);
  end loop;
end $$;

drop policy if exists "submissions_owner_insert" on public.assignment_submissions;
create policy "submissions_owner_insert" on public.assignment_submissions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "snapshots_owner_insert" on public.readiness_snapshots;
create policy "snapshots_owner_insert" on public.readiness_snapshots
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "sessions_owner_insert" on public.roleplay_sessions;
create policy "sessions_owner_insert" on public.roleplay_sessions
  for insert to authenticated with check (user_id = auth.uid());
-- a session can be updated (e.g. completed with its evaluation) only by its owner while it is active
drop policy if exists "sessions_owner_update" on public.roleplay_sessions;
create policy "sessions_owner_update" on public.roleplay_sessions
  for update to authenticated
  using (user_id = auth.uid() and status = 'active')
  with check (user_id = auth.uid());

-- messages may only be added to the caller's own active session
drop policy if exists "messages_owner_insert" on public.roleplay_messages;
create policy "messages_owner_insert" on public.roleplay_messages
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.roleplay_sessions s
      where s.id = session_id and s.user_id = auth.uid() and s.status = 'active'
    )
  );

-- User retention: weekly missions and the XP ledger.
--
-- Design notes
--  * Journey progress, achievements, total XP and the user's level are DERIVED
--    from existing rows (skill_profiles, service_offers, pricing_worksheets,
--    assignment_submissions, roleplay_sessions, readiness_snapshots) plus the two
--    tables below. They are deliberately not stored a second time, so they can
--    never drift from the user's real activity.
--  * The achievement catalog and weekly mission templates are version-controlled
--    in src/lib (progress.ts, retention.ts) and referenced here by key.
--  * xp_transactions is the single source of truth for rewards. One row per
--    (user, source, ref_key): an achievement or a weekly mission can be rewarded
--    only once, enforced by the database.

-- weekly_missions: a personalised mission issued to a user for one week --------
create table if not exists public.weekly_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,                                   -- Monday of the week
  template_key text not null check (char_length(template_key) between 1 and 80),
  title text not null check (char_length(title) between 1 and 200),
  description text not null check (char_length(description) between 1 and 1000),
  steps jsonb not null default '[]'::jsonb,
  reason text not null default '' check (char_length(reason) <= 400),
  category text not null check (category in ('research', 'offer', 'pricing', 'portfolio', 'sales', 'outreach')),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  xp_reward integer not null check (xp_reward between 1 and 200),
  deadline timestamptz not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  completion_note text check (completion_note is null or char_length(completion_note) between 15 and 1000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- duplicate prevention: the same mission cannot be issued twice in one week
  constraint weekly_missions_unique_per_week unique (user_id, week_start, template_key),
  -- a completed mission must say when and what was done
  constraint weekly_missions_completed_fields check (
    (status = 'active' and completed_at is null)
    or (status = 'completed' and completed_at is not null and completion_note is not null)
  )
);

create index if not exists weekly_missions_user_week_idx on public.weekly_missions (user_id, week_start);

drop trigger if exists weekly_missions_set_updated_at on public.weekly_missions;
create trigger weekly_missions_set_updated_at
  before update on public.weekly_missions
  for each row execute function public.set_updated_at();

-- xp_transactions: append-only reward ledger --------------------------------
create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source text not null check (source in ('achievement', 'weekly_mission')),
  ref_key text not null check (char_length(ref_key) between 1 and 80),   -- achievement key or weekly_missions.id
  amount integer not null check (amount between 1 and 500),
  label text not null check (char_length(label) between 1 and 200),
  created_at timestamptz not null default now(),
  -- no duplicate rewards
  constraint xp_transactions_unique_award unique (user_id, source, ref_key)
);

create index if not exists xp_transactions_user_idx on public.xp_transactions (user_id, created_at);

-- Row Level Security -------------------------------------------------------
alter table public.weekly_missions enable row level security;
alter table public.xp_transactions enable row level security;

drop policy if exists "weekly_missions_owner_all" on public.weekly_missions;
create policy "weekly_missions_owner_all" on public.weekly_missions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The ledger is append-only for its owner: rewards can be read and added, never
-- edited. Delete is allowed only so "reset workspace" can clear a user's own data.
drop policy if exists "xp_transactions_owner_select" on public.xp_transactions;
create policy "xp_transactions_owner_select" on public.xp_transactions
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "xp_transactions_owner_insert" on public.xp_transactions;
create policy "xp_transactions_owner_insert" on public.xp_transactions
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "xp_transactions_owner_delete" on public.xp_transactions;
create policy "xp_transactions_owner_delete" on public.xp_transactions
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.weekly_missions to authenticated;
grant select, insert, delete on public.xp_transactions to authenticated;

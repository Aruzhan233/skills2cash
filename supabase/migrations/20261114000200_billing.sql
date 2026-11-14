-- Billing access is written only by the verified Stripe webhook (service role).
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'free' check (status in ('free', 'active', 'canceled', 'past_due')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_requires_pro check (status <> 'active' or plan = 'pro')
);

create index if not exists subscriptions_status_idx on public.subscriptions (status, current_period_end);
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read" on public.subscriptions
  for select to authenticated using (user_id = auth.uid());
-- Intentionally no insert/update/delete policies for authenticated users.

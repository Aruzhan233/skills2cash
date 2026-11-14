-- Explicit Data API grants. Some Supabase projects do not automatically expose
-- new tables to the `authenticated` role; without these grants every request
-- fails with "permission denied". Row Level Security still restricts each user
-- to their own rows.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.assignments, public.roleplay_scenarios to anon;

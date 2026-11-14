-- Explicit Data API grants retained from the feature branch. Row Level
-- Security remains enabled and continues to restrict rows and operations.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.assignments, public.roleplay_scenarios to anon;

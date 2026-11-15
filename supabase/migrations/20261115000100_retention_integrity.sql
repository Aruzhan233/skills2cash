-- Retention integrity: atomic weekly-mission completion and tamper-resistant XP.
--
-- Forward-only follow-up to 20261115000000_retention.sql (apply that one first).
-- Nothing here drops or rewrites existing data; every statement is safe to re-run.
--
--  * complete_weekly_mission(): one transaction marks a mission completed and
--    records its XP from the mission's own stored reward. Repeating the call is a
--    no-op (awarded = false), so a double click or a retry can never pay twice.
--  * A guard trigger stops clients from inserting missions as already completed,
--    completing them directly, or editing a completed mission. Only the function
--    above (which runs as the table owner) may complete a mission.
--  * Clients may insert only achievement XP. Weekly-mission XP is written solely by
--    complete_weekly_mission(), so its amount always equals the mission's reward.
--  * user_xp_summary exposes each user's XP balance under their own RLS.
--  Levels stay derived from the XP total in src/lib/retention.ts (levelFor), so a
--  stored level can never drift from the ledger.

-- Guard ---------------------------------------------------------------------
create or replace function public.weekly_missions_guard()
returns trigger
language plpgsql
as $$
begin
  -- The completion function runs as the table owner; only API roles are restricted.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'active' or new.completed_at is not null or new.completion_note is not null then
      raise exception 'Weekly missions are created active; complete them with complete_weekly_mission()'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.user_id is distinct from old.user_id
     or new.week_start is distinct from old.week_start
     or new.template_key is distinct from old.template_key
     or new.xp_reward is distinct from old.xp_reward then
    raise exception 'A weekly mission''s owner, week, template and reward cannot be changed'
      using errcode = 'check_violation';
  end if;

  if old.status = 'completed' then
    -- Re-saving identical values (an idempotent upsert) is allowed; changing a completed mission is not.
    if new.status is distinct from old.status
       or new.completed_at is distinct from old.completed_at
       or new.completion_note is distinct from old.completion_note then
      raise exception 'A completed weekly mission cannot be changed' using errcode = 'check_violation';
    end if;
  elsif new.status = 'completed' then
    raise exception 'Complete weekly missions with complete_weekly_mission()' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists weekly_missions_guard on public.weekly_missions;
create trigger weekly_missions_guard
  before insert or update on public.weekly_missions
  for each row execute function public.weekly_missions_guard();

-- Atomic completion -----------------------------------------------------------
create or replace function public.complete_weekly_mission(
  p_mission_id uuid,
  p_note text,
  p_completed_at timestamptz default null
)
returns table (awarded boolean, completed_at timestamptz, xp_amount integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_mission public.weekly_missions%rowtype;
  v_note text := btrim(coalesce(p_note, ''));
  v_at timestamptz := coalesce(p_completed_at, now());
  v_inserted integer;
begin
  if v_uid is null then
    raise exception 'Sign in to complete missions' using errcode = '42501';
  end if;

  select * into v_mission
  from public.weekly_missions m
  where m.id = p_mission_id and m.user_id = v_uid
  for update;

  if not found then
    raise exception 'Mission not found' using errcode = 'P0002';
  end if;

  -- Already completed: report it without paying again.
  if v_mission.status = 'completed' then
    return query select false, v_mission.completed_at, 0;
    return;
  end if;

  if char_length(v_note) < 15 or char_length(v_note) > 1000 then
    raise exception 'Add a note of 15 to 1000 characters about what you did' using errcode = '22023';
  end if;
  -- A supplied timestamp (used when moving guest progress) must be plausible.
  if v_at > now() + interval '5 minutes' or v_at < v_mission.week_start::timestamptz - interval '1 day' then
    raise exception 'Invalid completion time' using errcode = '22023';
  end if;
  if v_at > v_mission.deadline then
    raise exception 'This mission''s deadline has passed' using errcode = '22023';
  end if;

  update public.weekly_missions m
  set status = 'completed', completion_note = v_note, completed_at = v_at
  where m.id = v_mission.id;

  insert into public.xp_transactions (user_id, source, ref_key, amount, label, created_at)
  values (v_uid, 'weekly_mission', v_mission.id::text, v_mission.xp_reward, left(v_mission.title, 200), v_at)
  on conflict (user_id, source, ref_key) do nothing;
  get diagnostics v_inserted = row_count;

  return query select v_inserted > 0, v_at, case when v_inserted > 0 then v_mission.xp_reward else 0 end;
end;
$$;

revoke all on function public.complete_weekly_mission(uuid, text, timestamptz) from public;
revoke all on function public.complete_weekly_mission(uuid, text, timestamptz) from anon;
grant execute on function public.complete_weekly_mission(uuid, text, timestamptz) to authenticated;

-- Clients may add achievement XP only -------------------------------------------
drop policy if exists "xp_transactions_owner_insert" on public.xp_transactions;
create policy "xp_transactions_owner_insert" on public.xp_transactions
  for insert to authenticated
  with check (user_id = auth.uid() and source = 'achievement');

-- XP balance per user (RLS of the caller applies) --------------------------------
create or replace view public.user_xp_summary
with (security_invoker = true) as
select
  user_id,
  sum(amount)::integer as total_xp,
  count(*)::integer as awards,
  max(created_at) as last_award_at
from public.xp_transactions
group by user_id;

revoke all on public.user_xp_summary from anon;
grant select on public.user_xp_summary to authenticated;

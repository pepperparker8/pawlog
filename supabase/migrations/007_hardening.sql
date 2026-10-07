-- 007 Hardening after advisor review.
-- 1. Internal SECURITY DEFINER functions are not callable through /rpc.
-- 2. Fixed search_path on every function.
-- 3. auth.uid() evaluated once per statement in policies; duplicate permissive policies merged.
-- 4. Covering indexes for foreign keys used in queries.
-- 5. Quests complete only for the current day; kitten growth is not flagged as weight gain.

-- ---------------------------------------------------------------------------
-- 1. Function privileges. Supabase grants EXECUTE to anon/authenticated directly,
--    so revoking from PUBLIC alone is not enough.
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- RLS helpers (policies run them as the caller) and the client API.
grant execute on function
  is_household_member(uuid),
  household_role_of(uuid),
  can_edit_household(uuid),
  is_household_owner(uuid),
  my_household_ids(),
  create_household(text),
  accept_invite(text),
  seed_demo_household(text),
  quest_progress(uuid, date),
  household_today(uuid),
  detect_patterns(uuid),
  on_this_day(uuid),
  search_household(uuid, text),
  level_for_xp(integer)
to authenticated;

-- ---------------------------------------------------------------------------
-- 2. search_path
-- ---------------------------------------------------------------------------
alter function set_updated_at() set search_path = public;
alter function enforce_tenant_consistency() set search_path = public;
alter function level_for_xp(integer) set search_path = public;
alter function bump_streak(date, integer, date, smallint) set search_path = public;
alter function quest_progress(uuid, date) set search_path = public;
alter function household_today(uuid) set search_path = public;
alter function detect_patterns(uuid) set search_path = public;
alter function on_this_day(uuid) set search_path = public;
alter function search_household(uuid, text) set search_path = public;

-- ---------------------------------------------------------------------------
-- 3. Policies
-- ---------------------------------------------------------------------------
drop policy "profiles: self read" on profiles;
drop policy "profiles: household peers read" on profiles;
create policy "profiles: self or peers read" on profiles
  for select to authenticated using (
    id = (select auth.uid())
    or exists (
      select 1 from household_members a
      join household_members b on a.household_id = b.household_id
      where a.user_id = (select auth.uid()) and b.user_id = profiles.id
    )
  );

drop policy "profiles: self update" on profiles;
create policy "profiles: self update" on profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy "members: owner remove or self leave" on household_members;
create policy "members: owner remove or self leave" on household_members
  for delete to authenticated using (is_household_owner(household_id) or user_id = (select auth.uid()));

drop policy "invites: owner create" on household_invites;
create policy "invites: owner create" on household_invites
  for insert to authenticated with check (is_household_owner(household_id) and created_by = (select auth.uid()));

drop policy "favorites: self" on cat_favorites;
create policy "favorites: self" on cat_favorites
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy "user_stats: self read" on user_stats;
drop policy "user_stats: peers read" on user_stats;
create policy "user_stats: self or peers read" on user_stats
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (
      select 1 from household_members a
      join household_members b on a.household_id = b.household_id
      where a.user_id = (select auth.uid()) and b.user_id = user_stats.user_id
    )
  );

drop policy "user_badges: self read" on user_badges;
drop policy "user_badges: peers read" on user_badges;
create policy "user_badges: self or peers read" on user_badges
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (
      select 1 from household_members a
      join household_members b on a.household_id = b.household_id
      where a.user_id = (select auth.uid()) and b.user_id = user_badges.user_id
    )
  );

drop policy "notifications: self read" on notifications;
drop policy "notifications: self update" on notifications;
drop policy "notifications: self delete" on notifications;
create policy "notifications: self read" on notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: self update" on notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: self delete" on notifications
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy "notification_preferences: self" on notification_preferences;
create policy "notification_preferences: self" on notification_preferences
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
create index if not exists xp_transactions_user_event_time_idx on xp_transactions (user_id, event_type, created_at desc);
create index if not exists xp_transactions_household_event_idx on xp_transactions (household_id, event_type, created_at desc);
create index if not exists medication_logs_cat_medication_idx on medication_logs (cat_medication_id, logged_at desc);
create index if not exists care_task_completions_cat_idx on care_task_completions (cat_id);
create index if not exists care_tasks_assigned_idx on care_tasks (assigned_to);
create index if not exists cat_conditions_household_idx on cat_conditions (household_id);
create index if not exists cat_favorites_cat_idx on cat_favorites (cat_id);
create index if not exists cat_medications_household_idx on cat_medications (household_id);
create index if not exists cat_stats_household_idx on cat_stats (household_id);
create index if not exists cats_profile_photo_idx on cats (profile_photo_id);
create index if not exists feeding_logs_food_idx on feeding_logs (food_id);
create index if not exists feeding_plans_food_idx on feeding_plans (food_id);
create index if not exists feeding_plans_household_idx on feeding_plans (household_id);
create index if not exists notifications_household_idx on notifications (household_id);
create index if not exists notifications_cat_idx on notifications (cat_id);
create index if not exists quest_completions_user_idx on quest_completions (user_id);
create index if not exists symptom_logs_related_medication_idx on symptom_logs (related_medication_id);
create index if not exists symptom_logs_vet_visit_idx on symptom_logs (vet_visit_id);
create index if not exists user_badges_badge_idx on user_badges (badge_code);
create index if not exists vaccination_records_vet_visit_idx on vaccination_records (vet_visit_id);

-- ---------------------------------------------------------------------------
-- 5a. Quests: only today's quests complete. Back-dated logs (offline sync, seed)
--     still earn their own XP but do not retro-complete past quests.
-- ---------------------------------------------------------------------------
create or replace function complete_quests_after_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if new.event_type <> 'quest_completions'
     and (new.created_at at time zone 'Asia/Jakarta')::date = today then
    perform complete_quests(new.household_id, new.user_id, today);
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 5b. Patterns: growth under 12 months is expected, so skip weight_gain for kittens.
-- ---------------------------------------------------------------------------
create or replace function detect_patterns(p_household uuid)
returns table (cat_id uuid, cat_name text, code text, severity text, title text, detail text, since timestamptz)
language sql stable security invoker set search_path = public as $$
  with active_cats as (
    select id, name, (date_of_birth is not null and date_of_birth > current_date - interval '1 year') as is_kitten
    from cats where household_id = p_household and archived_at is null
  ),
  weight_trend as (
    select c.id, c.name, c.is_kitten, w.weight_kg as last_kg, w.logged_at,
           (select (percentile_cont(0.5) within group (order by weight_kg))::numeric
            from weight_logs p where p.cat_id = c.id and p.logged_at < w.logged_at and p.logged_at >= w.logged_at - interval '30 days') as base_kg
    from active_cats c
    join lateral (select weight_kg, logged_at from weight_logs where cat_id = c.id order by logged_at desc limit 1) w on true
  ),
  symptom_repeat as (
    select c.id, c.name, lower(s.symptom) as symptom, count(*) as n, min(s.logged_at) as first_at, max(s.logged_at) as last_at
    from active_cats c join symptom_logs s on s.cat_id = c.id
    where s.logged_at > now() - interval '14 days'
    group by c.id, c.name, lower(s.symptom)
    having count(*) >= 3
  ),
  appetite_drop as (
    select c.id, c.name,
           avg(case when f.logged_at > now() - interval '3 days' then f.appetite end) as recent,
           avg(case when f.logged_at <= now() - interval '3 days' and f.logged_at > now() - interval '17 days' then f.appetite end) as base,
           min(case when f.logged_at > now() - interval '3 days' then f.logged_at end) as since
    from active_cats c join feeding_logs f on f.cat_id = c.id
    where f.appetite is not null
    group by c.id, c.name
  ),
  litter_issue as (
    select c.id, c.name, count(*) as n, min(l.logged_at) as since
    from active_cats c join litter_logs l on l.cat_id = c.id
    where l.logged_at > now() - interval '7 days'
      and (l.stool in ('diarrhea', 'blood') or l.urine in ('blood', 'none', 'frequent'))
    group by c.id, c.name
    having count(*) >= 2
  ),
  missed_meds as (
    select c.id, c.name, m.name as med, m.times_per_day,
           (select count(*) from medication_logs l where l.cat_medication_id = m.id and l.logged_at > now() - interval '2 days' and not l.skipped) as given
    from active_cats c join cat_medications m on m.cat_id = c.id and m.active
    where m.times_per_day is not null
  ),
  quiet as (
    select c.id, c.name, max(t.occurred_at) as last_at
    from active_cats c left join timeline_events t on t.cat_id = c.id
    group by c.id, c.name
  )
  select id, name, 'weight_drop', 'act', 'Weight down',
         format('Last weigh-in %s kg vs %s kg median over the previous 30 days (%s%%)',
                last_kg, round(base_kg, 2), round((last_kg - base_kg) / base_kg * 100, 1)), logged_at
  from weight_trend where base_kg is not null and last_kg < base_kg * 0.95
  union all
  select id, name, 'weight_gain', 'watch', 'Weight up',
         format('Last weigh-in %s kg vs %s kg median over the previous 30 days (+%s%%)',
                last_kg, round(base_kg, 2), round((last_kg - base_kg) / base_kg * 100, 1)), logged_at
  from weight_trend where base_kg is not null and not is_kitten and last_kg > base_kg * 1.08
  union all
  select id, name, 'symptom_repeat', case when n >= 5 then 'act' else 'watch' end, 'Repeated symptom',
         format('"%s" logged %s times in the last 14 days', symptom, n), first_at
  from symptom_repeat
  union all
  select id, name, 'appetite_drop', 'watch', 'Eating less',
         format('Average appetite %s over 3 days vs %s over the two weeks before', round(recent, 1), round(base, 1)), since
  from appetite_drop where recent is not null and base is not null and recent < base - 1
  union all
  select id, name, 'litter_change', 'act', 'Litter box change',
         format('%s unusual litter observations in the last 7 days', n), since
  from litter_issue
  union all
  select id, name, 'missed_medication', 'act', 'Medication behind schedule',
         format('%s: %s of %s doses logged in the last 2 days', med, given, times_per_day * 2), now() - interval '2 days'
  from missed_meds where given < times_per_day * 2
  union all
  select id, name, 'quiet_cat', 'info', 'No logs lately',
         case when last_at is null then 'Nothing logged for this cat yet' else format('Last log %s days ago', (now()::date - last_at::date)) end,
         coalesce(last_at, now())
  from quiet where last_at is null or last_at < now() - interval '3 days';
$$;

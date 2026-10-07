-- 004 Unified timeline, dashboard aggregates, pattern detection (deterministic, no scoring).

-- ---------------------------------------------------------------------------
-- timeline_events: one view over every log table. security_invoker keeps RLS.
-- ---------------------------------------------------------------------------
create or replace view timeline_events with (security_invoker = true) as
  select id, household_id, cat_id, 'weight' as kind, logged_at as occurred_at,
         weight_kg::text || ' kg' as title, note as detail,
         jsonb_build_object('weight_kg', weight_kg, 'bcs', body_condition_score) as data,
         created_by, created_at from weight_logs
  union all
  select id, household_id, cat_id, 'feeding', logged_at,
         coalesce(food_name, 'Meal'), note,
         jsonb_build_object('food_id', food_id, 'amount', amount, 'unit', unit, 'kcal', estimated_kcal, 'appetite', appetite),
         created_by, created_at from feeding_logs
  union all
  select id, household_id, cat_id, 'water', logged_at, 'Water ' || action, note,
         jsonb_build_object('action', action, 'amount_ml', amount_ml), created_by, created_at from water_logs
  union all
  select id, household_id, cat_id, 'litter', logged_at, 'Litter ' || action, note,
         jsonb_build_object('action', action, 'stool', stool, 'urine', urine), created_by, created_at from litter_logs
  union all
  select id, household_id, cat_id, 'symptom', logged_at, symptom, note,
         jsonb_build_object('severity', severity, 'started_on', started_on, 'ended_on', ended_on, 'frequency', frequency),
         created_by, created_at from symptom_logs
  union all
  select id, household_id, cat_id, 'medication', logged_at,
         coalesce(medication_name, 'Medication') || case when skipped then ' (skipped)' else '' end, note,
         jsonb_build_object('cat_medication_id', cat_medication_id, 'dose', dose, 'skipped', skipped),
         created_by, created_at from medication_logs
  union all
  select id, household_id, cat_id, 'grooming', logged_at, 'Grooming: ' || type, note,
         jsonb_build_object('type', type, 'duration_min', duration_min, 'coat', coat_condition), created_by, created_at from grooming_logs
  union all
  select id, household_id, cat_id, 'behavior', logged_at, behavior, note,
         jsonb_build_object('mood', mood, 'intensity', intensity), created_by, created_at from behavior_logs
  union all
  select id, household_id, cat_id, 'activity', logged_at, initcap(activity), note,
         jsonb_build_object('activity', activity, 'duration_min', duration_min), created_by, created_at from activity_logs
  union all
  select id, household_id, cat_id, 'journal', logged_at, coalesce(title, 'Journal'), body,
         '{}'::jsonb, created_by, created_at from journal_entries
  union all
  select id, household_id, cat_id, 'photo', taken_at, coalesce(caption, 'Photo'), null,
         jsonb_build_object('storage_path', storage_path, 'thumbnail_path', thumbnail_path, 'tags', tags),
         created_by, created_at from photos
  union all
  select id, household_id, cat_id, 'vet_visit', visited_on::timestamptz, coalesce(reason, 'Vet visit'), findings,
         jsonb_build_object('clinic', clinic, 'vet_name', vet_name, 'cost', cost, 'follow_up_on', follow_up_on),
         created_by, created_at from vet_visits
  union all
  select id, household_id, cat_id, 'vaccination', given_on::timestamptz, vaccine_name, note,
         jsonb_build_object('next_due_on', next_due_on, 'clinic', clinic), created_by, created_at from vaccination_records
  union all
  select id, household_id, cat_id, 'parasite', given_on::timestamptz, initcap(replace(kind::text, '_', ' ')) || coalesce(': ' || product, ''), note,
         jsonb_build_object('kind', kind, 'next_due_on', next_due_on), created_by, created_at from parasite_treatments
  union all
  select c.id, c.household_id, c.cat_id, 'care_task', c.completed_at, t.name, c.note,
         jsonb_build_object('task_id', c.task_id, 'kind', t.kind), c.completed_by, c.created_at
  from care_task_completions c join care_tasks t on t.id = c.task_id
  union all
  select id, household_id, cat_id, 'milestone', reached_at, label, null,
         jsonb_build_object('code', code), null::uuid, reached_at from milestones;

grant select on timeline_events to authenticated;

-- ---------------------------------------------------------------------------
-- Per-cat summary for dashboard cards (one row per cat, cheap).
-- ---------------------------------------------------------------------------
create or replace view cat_summaries with (security_invoker = true) as
  select c.id as cat_id, c.household_id, c.name, c.nickname, c.sex, c.breed, c.color,
         c.date_of_birth, c.dob_is_estimate, c.archived_at, c.profile_photo_id,
         p.thumbnail_path as profile_thumbnail_path, p.storage_path as profile_photo_path,
         w.weight_kg as last_weight_kg, w.logged_at as last_weight_at,
         (select max(logged_at) from feeding_logs f where f.cat_id = c.id) as last_fed_at,
         (select max(logged_at) from litter_logs l where l.cat_id = c.id) as last_litter_at,
         (select max(logged_at) from medication_logs m where m.cat_id = c.id) as last_medication_at,
         (select max(logged_at) from grooming_logs g where g.cat_id = c.id) as last_grooming_at,
         (select max(logged_at) from symptom_logs s where s.cat_id = c.id) as last_symptom_at,
         (select count(*) from symptom_logs s where s.cat_id = c.id and s.logged_at > now() - interval '7 days')::integer as symptoms_7d,
         (select count(*) from cat_medications m where m.cat_id = c.id and m.active)::integer as active_medications,
         (select min(next_due_on) from vaccination_records v where v.cat_id = c.id and v.next_due_on is not null) as next_vaccine_due,
         (select min(next_due_on) from parasite_treatments v where v.cat_id = c.id and v.next_due_on is not null) as next_parasite_due,
         (select min(next_due_on) from care_tasks t where t.cat_id = c.id and t.active and t.next_due_on is not null) as next_task_due,
         coalesce(cs.total_xp, 0) as total_xp, coalesce(cs.level, 1) as level,
         coalesce(cs.streak_current, 0) as streak_current,
         (select count(*) from photos ph where ph.cat_id = c.id)::integer as photo_count
  from cats c
  left join photos p on p.id = c.profile_photo_id
  left join lateral (
    select weight_kg, logged_at from weight_logs where cat_id = c.id order by logged_at desc limit 1
  ) w on true
  left join cat_stats cs on cs.cat_id = c.id;

grant select on cat_summaries to authenticated;

-- ---------------------------------------------------------------------------
-- Household quick counters (today)
-- ---------------------------------------------------------------------------
create or replace function household_today(p_household uuid)
returns jsonb language sql stable security invoker as $$
  with d as (select (now() at time zone 'Asia/Jakarta')::date as today)
  select jsonb_build_object(
    'date', (select today from d),
    'cats', (select count(*) from cats where household_id = p_household and archived_at is null),
    'logs_today', (select count(*) from timeline_events t, d
                   where t.household_id = p_household and (t.occurred_at at time zone 'Asia/Jakarta')::date = d.today),
    'xp_today', (select coalesce(sum(xp), 0) from xp_transactions x, d
                 where x.household_id = p_household and (x.created_at at time zone 'Asia/Jakarta')::date = d.today),
    'cats_fed_today', (select count(distinct cat_id) from feeding_logs f, d
                       where f.household_id = p_household and (f.logged_at at time zone 'Asia/Jakarta')::date = d.today),
    'tasks_due', (select count(*) from care_tasks t, d
                  where t.household_id = p_household and t.active and t.next_due_on is not null and t.next_due_on <= d.today),
    'symptoms_7d', (select count(*) from symptom_logs s where s.household_id = p_household and s.logged_at > now() - interval '7 days')
  );
$$;
grant execute on function household_today(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Growth: weekly aggregates per cat (for charts over long ranges)
-- ---------------------------------------------------------------------------
create or replace view weight_weekly with (security_invoker = true) as
  select cat_id, household_id,
         date_trunc('week', logged_at)::date as week_start,
         round(avg(weight_kg), 3) as avg_kg, min(weight_kg) as min_kg, max(weight_kg) as max_kg,
         count(*)::integer as samples
  from weight_logs
  group by cat_id, household_id, date_trunc('week', logged_at);
grant select on weight_weekly to authenticated;

-- ---------------------------------------------------------------------------
-- Pattern detection. Rule based, explains itself, never diagnoses.
-- Each row: cat_id, code, severity (info|watch|act), title, detail, since.
-- ---------------------------------------------------------------------------
create or replace function detect_patterns(p_household uuid)
returns table (cat_id uuid, cat_name text, code text, severity text, title text, detail text, since timestamptz)
language sql stable security invoker as $$
  with active_cats as (
    select id, name from cats where household_id = p_household and archived_at is null
  ),
  -- weight: compare last reading to the median of the 30 days before it
  weight_trend as (
    select c.id, c.name, w.weight_kg as last_kg, w.logged_at,
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
  from weight_trend where base_kg is not null and last_kg > base_kg * 1.08
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
grant execute on function detect_patterns(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- On this day
-- ---------------------------------------------------------------------------
create or replace function on_this_day(p_household uuid)
returns setof timeline_events language sql stable security invoker as $$
  select * from timeline_events
  where household_id = p_household
    and extract(month from occurred_at at time zone 'Asia/Jakarta') = extract(month from now() at time zone 'Asia/Jakarta')
    and extract(day from occurred_at at time zone 'Asia/Jakarta') = extract(day from now() at time zone 'Asia/Jakarta')
    and occurred_at < date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'
  order by occurred_at desc;
$$;
grant execute on function on_this_day(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Full-text search across cats, notes, symptoms, journal
-- ---------------------------------------------------------------------------
create or replace function search_household(p_household uuid, p_query text)
returns table (kind text, id uuid, cat_id uuid, title text, snippet text, occurred_at timestamptz)
language sql stable security invoker as $$
  select 'cat' as kind, id, id as cat_id, name as title, coalesce(breed, '') || ' ' || coalesce(color, '') as snippet, created_at as occurred_at
  from cats where household_id = p_household and (name ilike '%' || p_query || '%' or breed ilike '%' || p_query || '%')
  union all
  select kind, id, cat_id, title, left(coalesce(detail, ''), 120), occurred_at
  from timeline_events
  where household_id = p_household
    and (title ilike '%' || p_query || '%' or detail ilike '%' || p_query || '%')
  union all
  select 'medication', id, cat_id, name, coalesce(dose, ''), created_at
  from cat_medications where household_id = p_household and name ilike '%' || p_query || '%'
  order by occurred_at desc
  limit 50;
$$;
grant execute on function search_household(uuid, text) to authenticated;

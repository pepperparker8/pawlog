-- 010 Medication window: detect_patterns only judges a medication inside its start_on..end_on course,
-- and expects doses only since the later of start_on and yesterday.

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
  med_window as (
    select c.id, c.name, m.id as med_id, m.name as med, m.times_per_day,
           greatest(m.start_on, current_date - 1) as window_start
    from active_cats c join cat_medications m on m.cat_id = c.id and m.active
    where m.times_per_day is not null
      and (m.end_on is null or m.end_on >= current_date)
      and (m.start_on is null or m.start_on <= current_date)
  ),
  missed_meds as (
    select w.id, w.name, w.med, w.window_start,
           w.times_per_day * (current_date - w.window_start + 1) as expected,
           (select count(*) from medication_logs l where l.cat_medication_id = w.med_id and l.logged_at >= w.window_start::timestamptz and not l.skipped) as given
    from med_window w
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
         format('%s: %s of %s doses logged since %s', med, given, expected, to_char(window_start, 'DD Mon')), window_start::timestamptz
  from missed_meds where given < expected
  union all
  select id, name, 'quiet_cat', 'info', 'No logs lately',
         case when last_at is null then 'Nothing logged for this cat yet' else format('Last log %s days ago', (now()::date - last_at::date)) end,
         coalesce(last_at, now())
  from quiet where last_at is null or last_at < now() - interval '3 days';
$$;

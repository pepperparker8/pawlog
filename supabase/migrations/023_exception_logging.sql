-- 023 Exception-only logging: doses count as given unless marked missed, and a quiet day is a normal day.
-- missed_medication now reads skipped dose logs; quiet_cat is dropped.

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
    select c.id, c.name, l.medication_name as med, count(*) as n, min(l.logged_at) as first_at
    from active_cats c join medication_logs l on l.cat_id = c.id
    where l.skipped and l.logged_at > now() - interval '7 days'
    group by c.id, c.name, l.medication_name
  ),
  checkin_week as (
    select c.id, c.name,
           max(k.day) filter (where k.eating = 'none' and k.day >= current_date - 1) as not_eating_on,
           count(*) filter (where k.eating <> 'usual' and k.day >= current_date - 2) as less_3d,
           count(*) filter (where k.energy = 'low' and k.day >= current_date - 2) as low_3d,
           count(*) filter (where k.vomiting) as vomit_7d,
           count(*) filter (where k.litter = 'changed') as litter_7d,
           min(k.day) filter (where k.eating <> 'usual' and k.day >= current_date - 2) as less_since,
           min(k.day) filter (where k.energy = 'low' and k.day >= current_date - 2) as low_since,
           min(k.day) filter (where k.vomiting) as vomit_since,
           min(k.day) filter (where k.litter = 'changed') as litter_since
    from active_cats c join daily_checkins k on k.cat_id = c.id
    where k.day >= current_date - 6
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
  select id, name, 'missed_medication', case when n >= 2 then 'act' else 'watch' end, 'Missed dose',
         format('%s: %s missed in the last 7 days', med, n), first_at
  from missed_meds
  union all
  select id, name, 'checkin_not_eating', 'act', 'Not eating',
         format('Marked not eating on %s', to_char(not_eating_on, 'DD Mon')), not_eating_on::timestamptz
  from checkin_week where not_eating_on is not null
  union all
  select id, name, 'checkin_eating_less', 'watch', 'Eating less',
         format('Less than usual on %s of the last 3 days', less_3d), less_since::timestamptz
  from checkin_week where less_3d >= 3 and not_eating_on is null
  union all
  select id, name, 'checkin_vomiting', 'watch', 'Vomiting',
         format('Vomited on %s of the last 7 days', vomit_7d), vomit_since::timestamptz
  from checkin_week where vomit_7d >= 2
  union all
  select id, name, 'checkin_litter', 'watch', 'Litter changed',
         format('Litter not usual on %s of the last 7 days', litter_7d), litter_since::timestamptz
  from checkin_week where litter_7d >= 2
  union all
  select id, name, 'checkin_low_energy', 'watch', 'Low energy',
         format('Low energy on %s of the last 3 days', low_3d), low_since::timestamptz
  from checkin_week where low_3d >= 3;
$$;

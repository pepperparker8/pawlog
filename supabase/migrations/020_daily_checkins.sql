-- 020 Daily check-in: one row per cat per local day, four plain questions instead of separate logs.
-- Check-ins appear on the timeline and feed detect_patterns. They earn no XP.

create table daily_checkins (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  day             date not null,
  checked_at      timestamptz not null default now(),
  eating          text not null default 'usual' check (eating in ('usual', 'less', 'none')),
  litter          text not null default 'usual' check (litter in ('usual', 'changed')),
  vomiting        boolean not null default false,
  energy          text not null default 'usual' check (energy in ('usual', 'low')),
  tags            text[] not null default '{}'
                  check (tags <@ array['visitors', 'travel', 'new_pet', 'vet_visit', 'routine_change']),
  note            text check (char_length(note) <= 2000),
  client_event_id uuid unique,
  created_by      uuid not null default auth.uid() references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (cat_id, day)
);
create index daily_checkins_household_day_idx on daily_checkins (household_id, day desc);

alter table daily_checkins enable row level security;
create policy "daily_checkins: member read" on daily_checkins for select using (is_household_member(household_id));
create policy "daily_checkins: editor insert" on daily_checkins for insert with check (can_edit_household(household_id));
create policy "daily_checkins: editor update" on daily_checkins for update
  using (can_edit_household(household_id)) with check (can_edit_household(household_id));
create policy "daily_checkins: editor delete" on daily_checkins for delete using (can_edit_household(household_id));

create trigger daily_checkins_tenant before insert or update on daily_checkins
  for each row execute function enforce_tenant_consistency();
create trigger daily_checkins_updated_at before update on daily_checkins
  for each row execute function set_updated_at();
create trigger daily_checkins_audit after insert or update or delete on daily_checkins
  for each row execute function write_audit_log();

-- Timeline: append check-ins to the live view definition.
do $$
declare d text := rtrim(pg_get_viewdef('public.timeline_events'::regclass, false));
begin
  if d not like '%FROM milestones%WHERE (milestones.archived_at IS NULL);' then raise exception 'timeline_events changed shape'; end if;
  execute 'create or replace view public.timeline_events with (security_invoker = true) as '
    || left(d, length(d) - 1) || $v$
  union all
  select id, household_id, cat_id, 'checkin', checked_at,
         coalesce(nullif(concat_ws(' · ',
           case eating when 'less' then 'Eating less' when 'none' then 'Not eating' end,
           case when litter = 'changed' then 'Litter changed' end,
           case when vomiting then 'Vomited' end,
           case when energy = 'low' then 'Low energy' end), ''), 'All usual'),
         note,
         jsonb_build_object('day', day, 'eating', eating, 'litter', litter, 'vomiting', vomiting, 'energy', energy, 'tags', tags),
         created_by, created_at
  from daily_checkins$v$;
end $$;

-- Patterns: same rules as 010 plus check-in rules.
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
  from checkin_week where low_3d >= 3
  union all
  select id, name, 'quiet_cat', 'info', 'Nothing recorded lately',
         case when last_at is null then 'Nothing recorded for this cat yet' else format('Last entry %s days ago', (now()::date - last_at::date)) end,
         coalesce(last_at, now())
  from quiet where last_at is null or last_at < now() - interval '3 days';
$$;

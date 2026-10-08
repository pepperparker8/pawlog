-- 015 Care journey: XP retune with diminishing returns, care-journey level titles, meaningful badges,
-- contextual weight milestones, weekly per-cat goals and a forgiving Care Rhythm in place of streaks.
-- XP still rewards care actions only, never a weight value or a health state.

-- ---------------------------------------------------------------------------
-- 1. XP: weights and diminishing returns
-- ---------------------------------------------------------------------------
-- full_per_day: actions per cat per day at full XP. Each further action earns half the previous one.
alter table xp_rules add column full_per_day smallint not null default 0 check (full_per_day >= 0);

update xp_rules r set xp = v.xp, full_per_day = v.per_day
from (values
  ('weight_logs', 10, 1), ('feeding_logs', 5, 3), ('water_logs', 3, 2), ('litter_logs', 5, 3),
  ('medication_logs', 15, 0), ('vaccination_records', 25, 0), ('vet_visits', 30, 0), ('parasite_treatments', 25, 0),
  ('grooming_logs', 10, 1), ('activity_logs', 10, 2), ('symptom_logs', 5, 2), ('behavior_logs', 5, 2),
  ('photos', 5, 3), ('journal_entries', 5, 2), ('care_task_completions', 20, 0)
) as v(event_type, xp, per_day)
where r.event_type = v.event_type;

insert into xp_rules (event_type, label, xp, window_minutes, daily_cap) values
  ('weekly_quest_completions', 'Weekly goal', 0, 0, 0)
on conflict (event_type) do nothing;

create or replace function award_xp(p_household uuid, p_user uuid, p_cat uuid, p_event_type text,
                                    p_source_table text, p_source_id uuid, p_client_event_id uuid,
                                    p_at timestamptz default now())
returns integer language plpgsql security definer set search_path = public as $$
declare
  rule xp_rules;
  earned integer;
  reason text := 'awarded';
  day_start timestamptz := date_trunc('day', p_at at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
  today_xp integer;
  done_today integer;
  nil uuid := '00000000-0000-0000-0000-000000000000';
begin
  select * into rule from xp_rules where event_type = p_event_type and active;
  if not found then return 0; end if;
  earned := rule.xp;

  if rule.window_minutes > 0 and exists (
    select 1 from xp_transactions
    where event_type = p_event_type and user_id = p_user and coalesce(cat_id, nil) = coalesce(p_cat, nil)
      and xp > 0 and created_at > p_at - make_interval(mins => rule.window_minutes)
  ) then
    earned := 0; reason := 'window';
  end if;

  if earned > 0 and rule.full_per_day > 0 then
    select count(*) into done_today from xp_transactions
    where event_type = p_event_type and user_id = p_user and coalesce(cat_id, nil) = coalesce(p_cat, nil)
      and xp > 0 and created_at >= day_start and created_at < day_start + interval '1 day';
    if done_today >= rule.full_per_day then
      earned := rule.xp / (2 ^ (done_today - rule.full_per_day + 1))::integer; reason := 'diminished';
    end if;
  end if;

  if earned > 0 and rule.daily_cap > 0 then
    select coalesce(sum(xp), 0) into today_xp from xp_transactions
    where event_type = p_event_type and user_id = p_user
      and created_at >= day_start and created_at < day_start + interval '1 day';
    if today_xp + earned > rule.daily_cap then
      earned := greatest(rule.daily_cap - today_xp, 0); reason := 'capped';
    end if;
  end if;

  insert into xp_transactions (household_id, user_id, cat_id, event_type, source_table, source_id, client_event_id, xp, reason, created_at)
  values (p_household, p_user, p_cat, p_event_type, p_source_table, p_source_id, p_client_event_id, earned, reason, p_at)
  on conflict do nothing;
  return earned;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Care-journey level titles
-- ---------------------------------------------------------------------------
update level_config l set title = v.title, perk = null
from (values
  (1, 'Getting Started'), (2, 'Daily Helper'), (3, 'Routine Builder'), (4, 'Attentive Caregiver'),
  (5, 'Health Watcher'), (6, 'Steady Companion'), (7, 'Care Planner'), (8, 'Trusted Caregiver'),
  (9, 'Care Mentor'), (10, 'Devoted Caregiver'), (12, 'Household Anchor'), (15, 'Lifelong Companion'), (20, 'Cat Care Expert')
) as v(level, title)
where l.level = v.level;

-- ---------------------------------------------------------------------------
-- 3. Badges about consistent care, not volume or streaks
-- ---------------------------------------------------------------------------
alter table badges add column retired boolean not null default false;

update badges set retired = true
where code in ('streak_7', 'streak_30', 'streak_100', 'household_streak_30', 'multi_cat_8', 'feed_100', 'weigh_50');
update badges set name = 'Health Watcher', description = 'Reached the Health Watcher level' where code = 'level_5';
update badges set name = 'Devoted Caregiver', description = 'Reached the Devoted Caregiver level' where code = 'level_10';
update badges set name = 'Check-up Done', description = 'First vet visit recorded' where code = 'vet_first';

insert into badges (code, name, description, icon, scope, criteria, sort_order) values
  ('weigh_weeks_4',  'Steady Scale',      'Weigh-ins in four different weeks',        'scale',   'user', '{"kind":"weeks","event_type":"weight_logs","min":4}', 12),
  ('groom_weeks_4',  'Brushing Routine',  'Grooming in four different weeks',         'brush',   'user', '{"kind":"weeks","event_type":"grooming_logs","min":4}', 25),
  ('play_weeks_4',   'Play Partner',      'Play sessions in four different weeks',    'yarn',    'user', '{"kind":"weeks","event_type":"activity_logs","min":4}', 26),
  ('parasite_first', 'Bug Guard',         'First parasite treatment recorded',        'bug',     'user', '{"kind":"count","event_type":"parasite_treatments","min":1}', 32),
  ('care_weeks_12',  'Season of Care',    'Care logged in twelve different weeks',    'leaf',    'user', '{"kind":"weeks","event_type":"*","min":12}', 43),
  ('care_weeks_52',  'Year of Care',      'Care logged in fifty-two different weeks', 'cake',    'user', '{"kind":"weeks","event_type":"*","min":52}', 44),
  ('cat_goals_10',   'Well-Rounded',      'Ten weekly goals met for this cat',        'target',  'cat',  '{"kind":"weekly_goals","min":10}', 73)
on conflict (code) do nothing;

create or replace function check_badges(p_user uuid, p_household uuid, p_cat uuid)
returns setof text language plpgsql security definer set search_path = public as $$
declare
  b badges;
  met boolean;
  n integer;
  ev text;
begin
  for b in select * from badges where not retired order by sort_order loop
    met := false;
    ev := b.criteria ->> 'event_type';
    if b.scope = 'user' then
      case b.criteria ->> 'kind'
        when 'count' then
          select count(*) into n from xp_transactions where user_id = p_user and (ev = '*' or event_type = ev);
        when 'weeks' then
          select count(distinct date_trunc('week', created_at at time zone 'Asia/Jakarta')) into n from xp_transactions
          where user_id = p_user and (ev = '*' or event_type = ev)
            and event_type not in ('quest_completions', 'weekly_quest_completions');
        when 'level' then
          select coalesce(max(level), 1) into n from user_stats where user_id = p_user;
        else n := null;
      end case;
      met := coalesce(n >= (b.criteria ->> 'min')::integer, false);
      if met then
        insert into user_badges (user_id, badge_code) values (p_user, b.code) on conflict do nothing;
        if found then return next b.code; end if;
      end if;
    elsif b.scope = 'household' and p_household is not null then
      case b.criteria ->> 'kind'
        when 'cats' then
          select count(*) into n from cats where household_id = p_household and archived_at is null;
        else n := null;
      end case;
      met := coalesce(n >= (b.criteria ->> 'min')::integer, false);
      if met then
        insert into user_badges (user_id, badge_code, household_id) values (p_user, b.code, p_household) on conflict do nothing;
        if found then return next b.code; end if;
      end if;
    elsif b.scope = 'cat' and p_cat is not null then
      case b.criteria ->> 'kind'
        when 'count' then
          select count(*) into n from xp_transactions where cat_id = p_cat and event_type = ev;
        when 'days_logged' then
          select count(distinct (created_at at time zone 'Asia/Jakarta')::date) into n from xp_transactions where cat_id = p_cat;
        when 'weekly_goals' then
          select count(*) into n from weekly_quest_completions where cat_id = p_cat;
        else n := null;
      end case;
      met := coalesce(n >= (b.criteria ->> 'min')::integer, false);
      if met then
        insert into user_badges (user_id, badge_code, cat_id) values (p_user, b.code, p_cat) on conflict do nothing;
        if found then return next b.code; end if;
      end if;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Contextual weight milestones. Weight thresholds only count while the cat is a kitten,
--    so gaining weight as an adult is never celebrated.
-- ---------------------------------------------------------------------------
alter table milestones add column archived_at timestamptz;

update milestones m set archived_at = now()
from cats c
where c.id = m.cat_id and m.code ~ '^weight_[0-9]+kg$' and m.archived_at is null
  and (c.date_of_birth is null or m.reached_at >= c.date_of_birth + interval '12 months'
       or substring(m.code from '[0-9]+')::integer > 4);
update milestones set label = 'Kitten reached ' || substring(code from '[0-9]+') || ' kg'
where code ~ '^weight_[0-9]+kg$' and archived_at is null;

create or replace function apply_weight_milestones()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c cats;
  n integer;
  first_at timestamptz;
  prev numeric;
  t record;
  lo numeric;
  hi numeric;
  kg integer;
begin
  select * into c from cats where id = new.cat_id;
  select count(*), min(logged_at) into n, first_at from weight_logs where cat_id = new.cat_id;

  if n = 1 then
    insert into milestones (household_id, cat_id, code, label, reached_at)
    values (new.household_id, new.cat_id, 'first_weigh_in', 'First weigh-in', new.logged_at) on conflict (cat_id, code) do nothing;
  end if;
  if n >= 12 then
    insert into milestones (household_id, cat_id, code, label, reached_at)
    values (new.household_id, new.cat_id, 'weighins_12', '12 weigh-ins recorded', new.logged_at) on conflict (cat_id, code) do nothing;
  end if;
  if new.logged_at - first_at >= interval '6 months' then
    insert into milestones (household_id, cat_id, code, label, reached_at)
    values (new.household_id, new.cat_id, 'tracked_6m', 'Six months of weigh-ins', new.logged_at) on conflict (cat_id, code) do nothing;
  end if;
  if new.logged_at - first_at >= interval '1 year' then
    insert into milestones (household_id, cat_id, code, label, reached_at)
    values (new.household_id, new.cat_id, 'tracked_1y', 'A year of weigh-ins', new.logged_at) on conflict (cat_id, code) do nothing;
  end if;

  if c.date_of_birth is not null and new.logged_at < c.date_of_birth + interval '12 months' then
    for kg in 1 .. least(floor(new.weight_kg)::integer, 4) loop
      insert into milestones (household_id, cat_id, code, label, reached_at)
      values (new.household_id, new.cat_id, 'weight_' || kg || 'kg', 'Kitten reached ' || kg || ' kg', new.logged_at)
      on conflict (cat_id, code) do nothing;
    end loop;
  end if;

  -- Back inside a vet or owner target range after being outside it.
  select source, coalesce(min_kg, target_kg * 0.95) as lo, coalesce(max_kg, target_kg * 1.05) as hi into t
  from cat_weight_targets where cat_id = new.cat_id and archived_at is null
  order by (source = 'vet') desc, set_on desc limit 1;
  if found and t.lo is not null and t.hi is not null then
    lo := t.lo; hi := t.hi;
    select weight_kg into prev from weight_logs
    where cat_id = new.cat_id and id <> new.id and logged_at < new.logged_at order by logged_at desc limit 1;
    if prev is not null and (prev < lo or prev > hi) and new.weight_kg between lo and hi then
      insert into milestones (household_id, cat_id, code, label, reached_at)
      values (new.household_id, new.cat_id, 'back_in_range_' || to_char(new.logged_at at time zone 'Asia/Jakarta', 'YYYYMM'),
              'Back inside the ' || t.source || ' target range', new.logged_at)
      on conflict (cat_id, code) do nothing;
    end if;
  end if;
  return new;
end $$;

-- Timeline shows only current milestones.
do $$
declare d text := pg_get_viewdef('public.timeline_events'::regclass, false);
begin
  if right(rtrim(d), 16) <> 'FROM milestones;' then raise exception 'timeline_events changed shape'; end if;
  execute 'create or replace view public.timeline_events with (security_invoker = true) as '
    || left(rtrim(d), length(rtrim(d)) - 1) || ' WHERE milestones.archived_at IS NULL';
end $$;

-- ---------------------------------------------------------------------------
-- 5. Weekly goals per cat
-- ---------------------------------------------------------------------------
create table weekly_quest_templates (
  code         text primary key check (code ~ '^[a-z0-9-]+$'),
  title        text not null,
  description  text not null,
  icon         text not null,
  event_type   text not null references xp_rules (event_type),
  target       integer not null default 1 check (target > 0),
  coat_targets jsonb not null default '{}'::jsonb,   -- {"long": 3}: target by breed coat
  xp_reward    integer not null default 15 check (xp_reward >= 0),
  sort_order   smallint not null default 0,
  active       boolean not null default true
);
alter table weekly_quest_templates enable row level security;
create policy "weekly quests: read" on weekly_quest_templates for select to authenticated using (active);
grant select on weekly_quest_templates to authenticated;

insert into weekly_quest_templates (code, title, description, icon, event_type, target, coat_targets, xp_reward, sort_order) values
  ('weigh',  'Weekly weigh-in',  'One weigh-in this week',            '⚖️', 'weight_logs',   1, '{}', 20, 1),
  ('brush',  'Brushing',         'Brush or comb this week',           '🪮', 'grooming_logs', 1, '{"semi-long": 2, "long": 3}', 15, 2),
  ('play',   'Play together',    'Three play sessions this week',     '🧶', 'activity_logs', 3, '{}', 20, 3),
  ('moment', 'Capture a moment', 'Save one photo this week',          '📷', 'photos',        1, '{}', 10, 4);

create table weekly_quest_completions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  cat_id       uuid not null references cats (id) on delete cascade,
  user_id      uuid not null references profiles (id) on delete cascade,
  quest_code   text not null references weekly_quest_templates (code),
  week_start   date not null,
  completed_at timestamptz not null default now(),
  unique (cat_id, quest_code, week_start)
);
create index weekly_quest_completions_household_idx on weekly_quest_completions (household_id, week_start desc);
create index weekly_quest_completions_user_idx on weekly_quest_completions (user_id);
create index weekly_quest_completions_quest_idx on weekly_quest_completions (quest_code);
alter table weekly_quest_completions enable row level security;
create policy "weekly quests: member read" on weekly_quest_completions for select to authenticated using (is_household_member(household_id));
grant select on weekly_quest_completions to authenticated;

create or replace function week_start_of(p_at timestamptz)
returns date language sql immutable as $$
  select date_trunc('week', p_at at time zone 'Asia/Jakarta')::date;
$$;

create or replace function weekly_quest_progress(p_household uuid, p_week date default week_start_of(now()))
returns table (cat_id uuid, cat_name text, quest_code text, title text, description text, icon text,
               xp_reward integer, target integer, done integer, completed boolean)
language sql stable security invoker set search_path = public as $$
  with c as (
    select c.id, c.name, b.coat from cats c left join breeds b on b.code = c.breed_code
    where c.household_id = p_household and c.archived_at is null
  ),
  q as (
    select c.id as cat_id, c.name as cat_name, t.*, coalesce((t.coat_targets ->> c.coat)::integer, t.target) as needed
    from c cross join weekly_quest_templates t where t.active
  )
  select q.cat_id, q.cat_name, q.code, q.title, q.description, q.icon, q.xp_reward, q.needed,
         least(q.needed, (
           select count(*) from xp_transactions x
           where x.cat_id = q.cat_id and x.event_type = q.event_type
             and x.created_at >= (p_week::timestamp at time zone 'Asia/Jakarta')
             and x.created_at < ((p_week + 7)::timestamp at time zone 'Asia/Jakarta')
         ))::integer,
         exists (select 1 from weekly_quest_completions w where w.cat_id = q.cat_id and w.quest_code = q.code and w.week_start = p_week)
  from q
  order by q.cat_name, q.sort_order;
$$;

create or replace function complete_weekly_quests(p_household uuid, p_user uuid, p_cat uuid, p_week date)
returns setof text language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from weekly_quest_progress(p_household, p_week) where cat_id = p_cat and done >= target and not completed loop
    insert into weekly_quest_completions (household_id, cat_id, user_id, quest_code, week_start)
    values (p_household, p_cat, p_user, r.quest_code, p_week) on conflict do nothing;
    if found then
      insert into xp_transactions (household_id, user_id, cat_id, event_type, source_table, source_id, xp, reason)
      values (p_household, p_user, p_cat, 'weekly_quest_completions', 'weekly_quest_completions', gen_random_uuid(), r.xp_reward, 'weekly:' || r.quest_code);
      return next r.quest_code;
    end if;
  end loop;
end $$;

create or replace function complete_quests_after_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.event_type not in ('quest_completions', 'weekly_quest_completions') then
    perform complete_quests(new.household_id, new.user_id, (new.created_at at time zone 'Asia/Jakarta')::date);
    if new.cat_id is not null then
      perform complete_weekly_quests(new.household_id, new.user_id, new.cat_id, week_start_of(new.created_at));
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Care Rhythm: weekly goals met per cat over recent weeks. Missing a week never resets anything.
-- ---------------------------------------------------------------------------
create or replace function care_rhythm(p_household uuid, p_weeks integer default 8)
returns table (cat_id uuid, week_start date, goals_done integer, goals_total integer)
language sql stable security invoker set search_path = public as $$
  with w as (
    select (week_start_of(now()) - (g * 7))::date as week_start from generate_series(0, greatest(p_weeks, 1) - 1) g
  ),
  c as (select id from cats where household_id = p_household and archived_at is null)
  select c.id, w.week_start,
         (select count(*) from weekly_quest_completions q where q.cat_id = c.id and q.week_start = w.week_start)::integer,
         (select count(*) from weekly_quest_templates where active)::integer
  from c cross join w
  order by c.id, w.week_start;
$$;

grant execute on function weekly_quest_progress(uuid, date), care_rhythm(uuid, integer), week_start_of(timestamptz) to authenticated;

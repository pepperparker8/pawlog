-- 003 Gamification: XP rules, levels, transactions, badges, quests, streaks.
-- XP rewards care actions, never health status. All rules live in tables.

-- ---------------------------------------------------------------------------
-- Config tables (readable by everyone signed in, managed by service role)
-- ---------------------------------------------------------------------------
create table xp_rules (
  event_type     text primary key,          -- weight_logs, feeding_logs, ...
  label          text not null,
  xp             integer not null check (xp >= 0),
  window_minutes integer not null default 0 check (window_minutes >= 0),   -- same cat + type inside window = 0 XP
  daily_cap      integer not null default 0 check (daily_cap >= 0),        -- 0 = no cap
  active         boolean not null default true
);

create table level_config (
  level     integer primary key check (level >= 1),
  min_xp    integer not null check (min_xp >= 0),
  title     text not null,
  perk      text
);

insert into xp_rules (event_type, label, xp, window_minutes, daily_cap) values
  ('weight_logs',           'Weigh in',              10, 720, 20),
  ('feeding_logs',          'Feed',                   5,  60, 30),
  ('water_logs',            'Fresh water',            3, 120, 12),
  ('litter_logs',           'Litter care',            5, 120, 20),
  ('medication_logs',       'Give medication',       20,  60, 60),
  ('vaccination_records',   'Vaccination',           50,   0,  0),
  ('vet_visits',            'Vet visit',             50,   0,  0),
  ('parasite_treatments',   'Parasite treatment',    30,   0,  0),
  ('grooming_logs',         'Grooming',              10, 180, 30),
  ('activity_logs',         'Play session',          10,  60, 30),
  ('symptom_logs',          'Observation',            5,  30, 15),
  ('behavior_logs',         'Behavior note',          5,  30, 15),
  ('photos',                'Memory photo',           5,  10, 25),
  ('journal_entries',       'Journal entry',          5,  30, 15),
  ('care_task_completions', 'Care task done',        15,   0, 60),
  ('quest_completions',     'Daily quest',            0,   0,  0);   -- quests carry their own reward

insert into level_config (level, min_xp, title, perk) values
  (1,     0, 'New Pawrent',        null),
  (2,   100, 'Kitten Sitter',      null),
  (3,   250, 'Litter Keeper',      null),
  (4,   500, 'Cat Caretaker',      null),
  (5,  1000, 'Whisker Watcher',    'Custom badge frame'),
  (6,  1750, 'Nap Guardian',       null),
  (7,  2750, 'Treat Sommelier',    null),
  (8,  4000, 'Purr Engineer',      null),
  (9,  5500, 'Cat Whisperer',      null),
  (10, 7500, 'Pawrent Pro',        'Household crest'),
  (12, 11000, 'Clowder Captain',   null),
  (15, 17500, 'Grand Pawrent',     'Golden paw'),
  (20, 30000, 'Legendary Cat Dad', null);

alter table xp_rules enable row level security;
alter table level_config enable row level security;
create policy "xp_rules: read" on xp_rules for select to authenticated using (true);
create policy "level_config: read" on level_config for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- XP ledger: one row per awarded event. client_event_id makes retries no-ops.
-- ---------------------------------------------------------------------------
create table xp_transactions (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  user_id         uuid not null references profiles (id) on delete cascade,
  cat_id          uuid references cats (id) on delete set null,
  event_type      text not null references xp_rules (event_type),
  source_table    text,
  source_id       uuid,
  client_event_id uuid,
  xp              integer not null,
  reason          text,                      -- 'capped', 'window', 'awarded'
  created_at      timestamptz not null default now(),
  unique (source_table, source_id),
  unique (client_event_id)
);
create index xp_transactions_user_time_idx on xp_transactions (user_id, created_at desc);
create index xp_transactions_household_time_idx on xp_transactions (household_id, created_at desc);
create index xp_transactions_cat_idx on xp_transactions (cat_id, created_at desc);

alter table xp_transactions enable row level security;
create policy "xp: member read" on xp_transactions
  for select to authenticated using (is_household_member(household_id));

-- Running totals kept by trigger (cheap reads for dashboards).
create table user_stats (
  user_id        uuid primary key references profiles (id) on delete cascade,
  total_xp       integer not null default 0,
  level          integer not null default 1,
  streak_current integer not null default 0,
  streak_best    integer not null default 0,
  streak_last_on date,
  freezes_left   smallint not null default 1,
  updated_at     timestamptz not null default now()
);
alter table user_stats enable row level security;
create policy "user_stats: self read" on user_stats for select to authenticated using (user_id = auth.uid());
create policy "user_stats: peers read" on user_stats for select to authenticated using (
  exists (select 1 from household_members a join household_members b on a.household_id = b.household_id
          where a.user_id = auth.uid() and b.user_id = user_stats.user_id));

create table household_stats (
  household_id   uuid primary key references households (id) on delete cascade,
  total_xp       integer not null default 0,
  level          integer not null default 1,
  streak_current integer not null default 0,
  streak_best    integer not null default 0,
  streak_last_on date,
  updated_at     timestamptz not null default now()
);
alter table household_stats enable row level security;
create policy "household_stats: member read" on household_stats
  for select to authenticated using (is_household_member(household_id));

create table cat_stats (
  cat_id         uuid primary key references cats (id) on delete cascade,
  household_id   uuid not null references households (id) on delete cascade,
  total_xp       integer not null default 0,
  level          integer not null default 1,
  streak_current integer not null default 0,
  streak_best    integer not null default 0,
  streak_last_on date,
  updated_at     timestamptz not null default now()
);
alter table cat_stats enable row level security;
create policy "cat_stats: member read" on cat_stats
  for select to authenticated using (is_household_member(household_id));

create or replace function level_for_xp(p_xp integer)
returns integer language sql stable as $$
  select coalesce((select max(level) from level_config where min_xp <= p_xp), 1);
$$;

-- Forgiving streak: a day counts when at least one XP event lands on it.
-- Missing one day uses a freeze (if any); missing more resets.
create or replace function bump_streak(p_last date, p_current integer, p_today date, p_freezes smallint,
                                       out new_current integer, out new_freezes smallint)
language plpgsql immutable as $$
begin
  new_freezes := p_freezes;
  if p_last is null then
    new_current := 1;
  elsif p_last = p_today then
    new_current := p_current;
  elsif p_last = p_today - 1 then
    new_current := p_current + 1;
  elsif p_last = p_today - 2 and p_freezes > 0 then
    new_current := p_current + 1;
    new_freezes := p_freezes - 1;
  else
    new_current := 1;
  end if;
end $$;

create or replace function apply_xp_transaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  today date := (new.created_at at time zone 'Asia/Jakarta')::date;
  s record;
begin
  if new.xp <= 0 then return new; end if;

  -- user
  insert into user_stats (user_id, total_xp) values (new.user_id, 0) on conflict do nothing;
  select * into s from user_stats where user_id = new.user_id for update;
  update user_stats
  set total_xp = s.total_xp + new.xp,
      level = level_for_xp(s.total_xp + new.xp),
      streak_current = b.new_current,
      streak_best = greatest(s.streak_best, b.new_current),
      streak_last_on = today,
      freezes_left = b.new_freezes,
      updated_at = now()
  from bump_streak(s.streak_last_on, s.streak_current, today, s.freezes_left) b
  where user_id = new.user_id;

  -- household
  insert into household_stats (household_id) values (new.household_id) on conflict do nothing;
  select * into s from household_stats where household_id = new.household_id for update;
  update household_stats
  set total_xp = s.total_xp + new.xp,
      level = level_for_xp(s.total_xp + new.xp),
      streak_current = b.new_current,
      streak_best = greatest(s.streak_best, b.new_current),
      streak_last_on = today,
      updated_at = now()
  from bump_streak(s.streak_last_on, s.streak_current, today, 0::smallint) b
  where household_id = new.household_id;

  -- cat
  if new.cat_id is not null then
    insert into cat_stats (cat_id, household_id) values (new.cat_id, new.household_id) on conflict do nothing;
    select * into s from cat_stats where cat_id = new.cat_id for update;
    update cat_stats
    set total_xp = s.total_xp + new.xp,
        level = level_for_xp(s.total_xp + new.xp),
        streak_current = b.new_current,
        streak_best = greatest(s.streak_best, b.new_current),
        streak_last_on = today,
        updated_at = now()
    from bump_streak(s.streak_last_on, s.streak_current, today, 0::smallint) b
    where cat_id = new.cat_id;
  end if;
  return new;
end $$;

create trigger xp_transactions_apply
  after insert on xp_transactions
  for each row execute function apply_xp_transaction();

-- Monthly streak freeze refill.
create or replace function refill_streak_freezes()
returns void language sql security definer set search_path = public as $$
  update user_stats set freezes_left = 1 where freezes_left < 1;
$$;

-- ---------------------------------------------------------------------------
-- award_xp(): called by triggers on log tables. Idempotent on (source_table, source_id).
-- ---------------------------------------------------------------------------
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
begin
  select * into rule from xp_rules where event_type = p_event_type and active;
  if not found then return 0; end if;
  earned := rule.xp;

  if rule.window_minutes > 0 and exists (
    select 1 from xp_transactions
    where event_type = p_event_type and user_id = p_user
      and coalesce(cat_id, '00000000-0000-0000-0000-000000000000') = coalesce(p_cat, '00000000-0000-0000-0000-000000000000')
      and xp > 0 and created_at > p_at - make_interval(mins => rule.window_minutes)
  ) then
    earned := 0; reason := 'window';
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

create or replace function award_xp_for_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  j jsonb := to_jsonb(new);
  actor uuid := coalesce((j ->> 'created_by')::uuid, (j ->> 'completed_by')::uuid, auth.uid());
  at_ts timestamptz := coalesce((j ->> 'logged_at')::timestamptz, (j ->> 'completed_at')::timestamptz,
                                (j ->> 'taken_at')::timestamptz, (j ->> 'given_on')::timestamptz,
                                (j ->> 'visited_on')::timestamptz, now());
begin
  if actor is null then return new; end if;
  perform award_xp((j ->> 'household_id')::uuid, actor, (j ->> 'cat_id')::uuid, tg_table_name,
                   tg_table_name, new.id, (j ->> 'client_event_id')::uuid, at_ts);
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'weight_logs','feeding_logs','water_logs','litter_logs','symptom_logs','medication_logs',
    'grooming_logs','behavior_logs','activity_logs','journal_entries','photos',
    'vet_visits','vaccination_records','parasite_treatments','care_task_completions'
  ] loop
    execute format('create trigger %I_xp after insert on %I for each row execute function award_xp_for_row()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Badges: rule rows evaluated by check_badges(). Criteria kinds are deterministic.
-- ---------------------------------------------------------------------------
create table badges (
  code        text primary key,
  name        text not null,
  description text not null,
  icon        text not null default 'paw',
  scope       text not null default 'user' check (scope in ('user', 'cat', 'household')),
  criteria    jsonb not null,            -- {"kind":"count","event_type":"weight_logs","min":10}
  sort_order  integer not null default 100
);
alter table badges enable row level security;
create policy "badges: read" on badges for select to authenticated using (true);

insert into badges (code, name, description, icon, scope, criteria, sort_order) values
  ('first_log',        'First Pawprint',    'Logged your first care action',            'paw',     'user', '{"kind":"count","event_type":"*","min":1}', 1),
  ('weigh_10',         'Scale Friend',      'Ten weigh-ins recorded',                   'scale',   'user', '{"kind":"count","event_type":"weight_logs","min":10}', 10),
  ('weigh_50',         'Growth Tracker',    'Fifty weigh-ins recorded',                 'chart',   'user', '{"kind":"count","event_type":"weight_logs","min":50}', 11),
  ('feed_100',         'Chef de Chat',      'One hundred meals logged',                 'bowl',    'user', '{"kind":"count","event_type":"feeding_logs","min":100}', 20),
  ('litter_30',        'Litter Legend',     'Thirty litter cleanups',                   'sparkle', 'user', '{"kind":"count","event_type":"litter_logs","min":30}', 21),
  ('groom_25',         'Fluff Master',      'Twenty-five grooming sessions',            'brush',   'user', '{"kind":"count","event_type":"grooming_logs","min":25}', 22),
  ('photo_50',         'Memory Keeper',     'Fifty photos saved',                       'camera',  'user', '{"kind":"count","event_type":"photos","min":50}', 23),
  ('meds_20',          'Pill Whisperer',    'Twenty medication doses given',            'pill',    'user', '{"kind":"count","event_type":"medication_logs","min":20}', 24),
  ('vet_first',        'Clinic Regular',    'First vet visit recorded',                 'stetho',  'user', '{"kind":"count","event_type":"vet_visits","min":1}', 30),
  ('vaccine_first',    'Shield Up',         'First vaccination recorded',               'shield',  'user', '{"kind":"count","event_type":"vaccination_records","min":1}', 31),
  ('streak_7',         'Week Warrior',      'Seven-day care streak',                    'flame',   'user', '{"kind":"streak","min":7}', 40),
  ('streak_30',        'Monthly Devotion',  'Thirty-day care streak',                   'flame',   'user', '{"kind":"streak","min":30}', 41),
  ('streak_100',       'Centurion',         'One hundred days in a row',                'crown',   'user', '{"kind":"streak","min":100}', 42),
  ('level_5',          'Whisker Watcher',   'Reached level 5',                          'star',    'user', '{"kind":"level","min":5}', 50),
  ('level_10',         'Pawrent Pro',       'Reached level 10',                         'star',    'user', '{"kind":"level","min":10}', 51),
  ('multi_cat_3',      'Clowder Keeper',    'Caring for three cats or more',            'cats',    'household', '{"kind":"cats","min":3}', 60),
  ('multi_cat_8',      'Cat Cafe',          'Caring for eight cats or more',            'cats',    'household', '{"kind":"cats","min":8}', 61),
  ('household_streak_30', 'Team Effort',    'Household active thirty days in a row',    'home',    'household', '{"kind":"streak","min":30}', 62),
  ('cat_weigh_12',     'Growth Diary',      'Twelve weigh-ins for this cat',            'scale',   'cat',  '{"kind":"count","event_type":"weight_logs","min":12}', 70),
  ('cat_first_photo',  'Say Cheese',        'First photo of this cat',                  'camera',  'cat',  '{"kind":"count","event_type":"photos","min":1}', 71),
  ('cat_year',         'Anniversary',       'One year of care logged for this cat',     'cake',    'cat',  '{"kind":"days_logged","min":365}', 72);

create table user_badges (
  user_id    uuid not null references profiles (id) on delete cascade,
  badge_code text not null references badges (code),
  cat_id     uuid references cats (id) on delete cascade,
  household_id uuid references households (id) on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_code, cat_id, household_id)
);
alter table user_badges alter column cat_id set default '00000000-0000-0000-0000-000000000000';
alter table user_badges alter column household_id set default '00000000-0000-0000-0000-000000000000';
alter table user_badges drop constraint user_badges_cat_id_fkey;
alter table user_badges drop constraint user_badges_household_id_fkey;
create index user_badges_user_idx on user_badges (user_id, earned_at desc);
alter table user_badges enable row level security;
create policy "user_badges: self read" on user_badges for select to authenticated using (user_id = auth.uid());
create policy "user_badges: peers read" on user_badges for select to authenticated using (
  exists (select 1 from household_members a join household_members b on a.household_id = b.household_id
          where a.user_id = auth.uid() and b.user_id = user_badges.user_id));

create or replace function check_badges(p_user uuid, p_household uuid, p_cat uuid)
returns setof text language plpgsql security definer set search_path = public as $$
declare
  b badges;
  met boolean;
  n integer;
  nil uuid := '00000000-0000-0000-0000-000000000000';
begin
  for b in select * from badges order by sort_order loop
    met := false;
    if b.scope = 'user' then
      case b.criteria ->> 'kind'
        when 'count' then
          select count(*) into n from xp_transactions
          where user_id = p_user and (b.criteria ->> 'event_type' = '*' or event_type = b.criteria ->> 'event_type');
          met := n >= (b.criteria ->> 'min')::integer;
        when 'streak' then
          select coalesce(max(streak_best), 0) into n from user_stats where user_id = p_user;
          met := n >= (b.criteria ->> 'min')::integer;
        when 'level' then
          select coalesce(max(level), 1) into n from user_stats where user_id = p_user;
          met := n >= (b.criteria ->> 'min')::integer;
        else met := false;
      end case;
      if met then
        insert into user_badges (user_id, badge_code) values (p_user, b.code) on conflict do nothing;
        if found then return next b.code; end if;
      end if;
    elsif b.scope = 'household' and p_household is not null then
      case b.criteria ->> 'kind'
        when 'cats' then
          select count(*) into n from cats where household_id = p_household and archived_at is null;
          met := n >= (b.criteria ->> 'min')::integer;
        when 'streak' then
          select coalesce(max(streak_best), 0) into n from household_stats where household_id = p_household;
          met := n >= (b.criteria ->> 'min')::integer;
        else met := false;
      end case;
      if met then
        insert into user_badges (user_id, badge_code, household_id) values (p_user, b.code, p_household) on conflict do nothing;
        if found then return next b.code; end if;
      end if;
    elsif b.scope = 'cat' and p_cat is not null then
      case b.criteria ->> 'kind'
        when 'count' then
          select count(*) into n from xp_transactions
          where cat_id = p_cat and event_type = b.criteria ->> 'event_type';
          met := n >= (b.criteria ->> 'min')::integer;
        when 'days_logged' then
          select count(distinct (created_at at time zone 'Asia/Jakarta')::date) into n from xp_transactions where cat_id = p_cat;
          met := n >= (b.criteria ->> 'min')::integer;
        else met := false;
      end case;
      if met then
        insert into user_badges (user_id, badge_code, cat_id) values (p_user, b.code, p_cat) on conflict do nothing;
        if found then return next b.code; end if;
      end if;
    end if;
  end loop;
end $$;

create or replace function check_badges_after_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform check_badges(new.user_id, new.household_id, new.cat_id);
  return new;
end $$;
create trigger xp_transactions_badges
  after insert on xp_transactions
  for each row execute function check_badges_after_xp();

-- ---------------------------------------------------------------------------
-- Quests: templates + per-household daily instances + completions
-- ---------------------------------------------------------------------------
create table quest_templates (
  code        text primary key,
  title       text not null,
  description text not null,
  event_type  text not null references xp_rules (event_type),
  target      integer not null default 1 check (target > 0),
  per_cat     boolean not null default false,     -- target applies to every active cat
  xp_reward   integer not null default 20 check (xp_reward >= 0),
  weekday_mask integer not null default 127,      -- bit per weekday, 127 = every day
  active      boolean not null default true
);
alter table quest_templates enable row level security;
create policy "quest_templates: read" on quest_templates for select to authenticated using (true);

insert into quest_templates (code, title, description, event_type, target, per_cat, xp_reward, weekday_mask) values
  ('feed_all',      'Breakfast is served',  'Log a meal for every cat',               'feeding_logs',  1, true,  20, 127),
  ('litter_daily',  'Fresh box',            'Scoop or clean the litter box',          'litter_logs',   1, false, 10, 127),
  ('water_daily',   'Fresh water',          'Refresh the water bowl',                 'water_logs',    1, false, 10, 127),
  ('play_15',       'Play time',            'Log a play session',                     'activity_logs', 1, false, 15, 127),
  ('weigh_weekly',  'Weekly weigh-in',      'Weigh every cat',                        'weight_logs',   1, true,  30, 64),
  ('groom_weekly',  'Brush day',            'Groom at least one cat',                 'grooming_logs', 1, false, 20, 8),
  ('photo_daily',   'Capture a moment',     'Save one photo',                         'photos',        1, false, 10, 127);

create table quest_completions (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households (id) on delete cascade,
  user_id        uuid not null references profiles (id) on delete cascade,
  quest_code     text not null references quest_templates (code),
  quest_date     date not null,
  completed_at   timestamptz not null default now(),
  unique (household_id, quest_code, quest_date)
);
create index quest_completions_household_idx on quest_completions (household_id, quest_date desc);
alter table quest_completions enable row level security;
create policy "quests: member read" on quest_completions for select to authenticated using (is_household_member(household_id));

-- Progress for today's quests, computed on read (no stale state).
create or replace function quest_progress(p_household uuid, p_date date default (now() at time zone 'Asia/Jakarta')::date)
returns table (quest_code text, title text, description text, xp_reward integer, target integer, done integer, completed boolean)
language sql stable security invoker as $$
  with active_cats as (
    select count(*)::integer as n from cats where household_id = p_household and archived_at is null
  ),
  q as (
    select t.*, case when t.per_cat then greatest(t.target * (select n from active_cats), 1) else t.target end as needed
    from quest_templates t
    where t.active and (t.weekday_mask & (1 << extract(isodow from p_date)::integer - 1)) <> 0
  )
  select q.code, q.title, q.description, q.xp_reward, q.needed,
         least(q.needed, (
           select case when q.per_cat
             then count(distinct x.cat_id)
             else count(*) end
           from xp_transactions x
           where x.household_id = p_household and x.event_type = q.event_type
             and (x.created_at at time zone 'Asia/Jakarta')::date = p_date
         ))::integer as done,
         exists (select 1 from quest_completions c where c.household_id = p_household and c.quest_code = q.code and c.quest_date = p_date)
  from q
  order by q.code;
$$;
grant execute on function quest_progress(uuid, date) to authenticated;

-- Claim a finished quest (called by app or by the completion trigger below).
create or replace function complete_quests(p_household uuid, p_user uuid, p_date date)
returns setof text language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from quest_progress(p_household, p_date) where done >= target and not completed loop
    insert into quest_completions (household_id, user_id, quest_code, quest_date)
    values (p_household, p_user, r.quest_code, p_date) on conflict do nothing;
    if found then
      insert into xp_transactions (household_id, user_id, event_type, source_table, source_id, xp, reason)
      values (p_household, p_user, 'quest_completions', 'quest_completions', gen_random_uuid(), r.xp_reward, 'quest:' || r.quest_code);
      return next r.quest_code;
    end if;
  end loop;
end $$;

create or replace function complete_quests_after_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.event_type <> 'quest_completions' then
    perform complete_quests(new.household_id, new.user_id, (new.created_at at time zone 'Asia/Jakarta')::date);
  end if;
  return new;
end $$;
create trigger xp_transactions_quests
  after insert on xp_transactions
  for each row execute function complete_quests_after_xp();

-- PawLog initial schema
-- Postgres / Supabase. All owner data is protected by row-level security.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type cat_sex as enum ('male', 'female', 'unknown');

create type care_activity as enum (
  'weigh', 'litter', 'grooming', 'medication', 'vaccine', 'vet_visit',
  'feed', 'water', 'poop', 'pee', 'play', 'coat_photo', 'note'
);

create type health_record_kind as enum (
  'vaccination', 'deworming', 'parasite', 'medication', 'vet_visit',
  'blood_test', 'dental', 'sterilization', 'allergy', 'microchip'
);

create type relationship_event_kind as enum (
  'chasing', 'hiding', 'eating_together', 'sleeping_near', 'playing',
  'allogrooming', 'conflict'
);

create type insight_severity as enum ('info', 'watch', 'anomaly');

-- ---------------------------------------------------------------------------
-- Owner profile
-- ---------------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  total_xp    integer not null default 0,
  created_at  timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Cats
-- ---------------------------------------------------------------------------
create table cats (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references profiles (id) on delete cascade,
  name                 text not null,
  title                text,                       -- "The Chill One"
  breed                text,
  sex                  cat_sex not null default 'unknown',
  date_of_birth        date,
  adopted_on           date,
  microchip_id         text,
  sterilized_on        date,
  target_adult_kg      numeric(5,2),               -- for Growth %
  traits               text[] not null default '{}',
  avatar_path          text,
  care_xp              integer not null default 0,
  created_at           timestamptz not null default now()
);
create index cats_owner_idx on cats (owner_id);

-- ---------------------------------------------------------------------------
-- XP rules (seeded, editable)
-- ---------------------------------------------------------------------------
create table xp_rules (
  activity   care_activity primary key,
  xp         integer not null,
  daily_cap  integer not null default 10,
  label      text not null
);

insert into xp_rules (activity, xp, daily_cap, label) values
  ('weigh',      10, 2,  'Weigh the cat'),
  ('litter',      5, 4,  'Clean litter'),
  ('grooming',   10, 2,  'Grooming'),
  ('medication', 20, 4,  'Give medication on schedule'),
  ('vaccine',    50, 1,  'Vaccination'),
  ('vet_visit',  50, 1,  'Vet check-up'),
  ('feed',        5, 6,  'Log a meal'),
  ('water',       5, 2,  'Check water'),
  ('poop',        3, 6,  'Log poop'),
  ('pee',         3, 6,  'Log pee'),
  ('play',       10, 3,  '15 min playtime'),
  ('coat_photo',  5, 2,  'Coat condition photo'),
  ('note',        0, 99, 'Note');

-- ---------------------------------------------------------------------------
-- Logs
-- ---------------------------------------------------------------------------
create table care_logs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles (id) on delete cascade,
  cat_id      uuid not null references cats (id) on delete cascade,
  activity    care_activity not null,
  logged_at   timestamptz not null default now(),
  xp_earned   integer not null default 0,
  note        text,
  meta        jsonb not null default '{}'::jsonb,  -- grams, pouch count, duration, product
  created_at  timestamptz not null default now()
);
create index care_logs_cat_time_idx on care_logs (cat_id, logged_at desc);
create index care_logs_owner_time_idx on care_logs (owner_id, logged_at desc);

create table weight_logs (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references profiles (id) on delete cascade,
  cat_id               uuid not null references cats (id) on delete cascade,
  measured_at          timestamptz not null default now(),
  weight_kg            numeric(5,3) not null check (weight_kg > 0),
  body_condition_score smallint check (body_condition_score between 1 and 9),
  note                 text
);
create index weight_logs_cat_time_idx on weight_logs (cat_id, measured_at desc);

create table health_logs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles (id) on delete cascade,
  cat_id      uuid not null references cats (id) on delete cascade,
  logged_at   timestamptz not null default now(),
  appetite    smallint check (appetite between 0 and 5),   -- 0 none, 3 normal, 5 ravenous
  stool       text,                                        -- normal, soft, diarrhea, none
  urine       text,                                        -- normal, frequent, none, blood
  mood        text,                                        -- playful, shy, calm, hiding
  symptoms    text[] not null default '{}',
  note        text
);
create index health_logs_cat_time_idx on health_logs (cat_id, logged_at desc);

create table health_records (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles (id) on delete cascade,
  cat_id      uuid not null references cats (id) on delete cascade,
  kind        health_record_kind not null,
  name        text not null,                 -- F3, F4, Rabies, Revolution Plus
  given_on    date,
  next_due_on date,
  clinic      text,
  vet_name    text,
  dose        text,
  result      text,                          -- blood test summary, dental finding
  note        text,
  created_at  timestamptz not null default now()
);
create index health_records_cat_idx on health_records (cat_id, kind, given_on desc);

create table photos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles (id) on delete cascade,
  cat_id       uuid not null references cats (id) on delete cascade,
  storage_path text not null,                -- photos/{owner_id}/{cat_id}/{uuid}.jpg
  caption      text,
  tag          text,                         -- daily, health, growth, grooming, food, behavior
  taken_at     timestamptz not null default now(),
  care_log_id  uuid references care_logs (id) on delete set null
);
create index photos_cat_time_idx on photos (cat_id, taken_at desc);

-- ---------------------------------------------------------------------------
-- Quests and streaks
-- ---------------------------------------------------------------------------
create table quest_templates (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles (id) on delete cascade,
  cat_id      uuid references cats (id) on delete cascade,   -- null = household quest
  activity    care_activity not null,
  label       text not null,
  active      boolean not null default true,
  sort_order  integer not null default 0
);

create table quest_completions (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles (id) on delete cascade,
  template_id  uuid not null references quest_templates (id) on delete cascade,
  quest_date   date not null,
  completed_at timestamptz not null default now(),
  care_log_id  uuid references care_logs (id) on delete set null,
  unique (template_id, quest_date)
);

-- ---------------------------------------------------------------------------
-- Milestones and achievements
-- ---------------------------------------------------------------------------
create table milestones (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles (id) on delete cascade,
  cat_id      uuid not null references cats (id) on delete cascade,
  code        text not null,                 -- weight_2kg, weight_3kg
  label       text not null,                 -- 2 kg Club
  reached_at  timestamptz not null default now(),
  unique (cat_id, code)
);

create table achievements (
  code        text primary key,
  label       text not null,
  description text not null,
  scope       text not null check (scope in ('cat', 'owner'))
);

insert into achievements (code, label, description, scope) values
  ('first_steps',        'First Steps',        '10 care logs',                                         'cat'),
  ('first_vaccine',      'First Vaccine',      'First vaccination record',                             'cat'),
  ('weight_tracker',     'Weight Tracker',     '5 weight logs',                                        'cat'),
  ('growth_tracker',     'Growth Tracker',     '3 weight logs within 30 days',                         'cat'),
  ('grooming_pro',       'Grooming Pro',       '10 grooming logs',                                     'cat'),
  ('grooming_master',    'Grooming Master',    '50 grooming logs',                                     'cat'),
  ('photo_chronicler',   'Photo Chronicler',   '30 photo logs',                                        'cat'),
  ('vaccine_keeper',     'Vaccine Keeper',     'No overdue vaccine for 90 days',                       'cat'),
  ('preventive_care_pro','Preventive Care Pro','Vaccine, deworming and parasite control on schedule for 180 days', 'cat'),
  ('ten_vet_visits',     '10 Vet Visits',      '10 vet visit records',                                 'cat'),
  ('one_year_together',  '1 Year Together',    '365 days since adoption',                              'cat'),
  ('streak_100',         '100-Day Care Streak','Daily care streak reaches 100',                        'owner');

create table achievement_unlocks (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references profiles (id) on delete cascade,
  cat_id           uuid references cats (id) on delete cascade,
  achievement_code text not null references achievements (code),
  unlocked_at      timestamptz not null default now(),
  unique (owner_id, cat_id, achievement_code)
);

-- ---------------------------------------------------------------------------
-- Relationships between cats
-- ---------------------------------------------------------------------------
create table relationships (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles (id) on delete cascade,
  cat_a_id    uuid not null references cats (id) on delete cascade,
  cat_b_id    uuid not null references cats (id) on delete cascade,
  score       integer not null default 50 check (score between 0 and 100),
  status      text,                          -- Getting Comfortable
  created_at  timestamptz not null default now(),
  check (cat_a_id < cat_b_id),
  unique (cat_a_id, cat_b_id)
);

create table relationship_events (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles (id) on delete cascade,
  relationship_id uuid not null references relationships (id) on delete cascade,
  kind            relationship_event_kind not null,
  happened_at     timestamptz not null default now(),
  note            text
);
create index relationship_events_rel_time_idx on relationship_events (relationship_id, happened_at desc);

-- ---------------------------------------------------------------------------
-- Insights
-- ---------------------------------------------------------------------------
create table insights (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles (id) on delete cascade,
  cat_id       uuid not null references cats (id) on delete cascade,
  severity     insight_severity not null default 'info',
  title        text not null,
  body         text not null,
  window_start date,
  window_end   date,
  source       text not null default 'rule',  -- rule, llm
  dismissed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index insights_cat_time_idx on insights (cat_id, created_at desc);

-- ---------------------------------------------------------------------------
-- XP bookkeeping
-- ---------------------------------------------------------------------------
create or replace function apply_care_log_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rule xp_rules%rowtype;
  today_count integer;
begin
  select * into rule from xp_rules where activity = new.activity;
  if not found then
    new.xp_earned := 0;
    return new;
  end if;

  select count(*) into today_count
  from care_logs
  where cat_id = new.cat_id
    and activity = new.activity
    and logged_at::date = new.logged_at::date;

  if today_count >= rule.daily_cap then
    new.xp_earned := 0;
  else
    new.xp_earned := rule.xp;
  end if;

  update cats set care_xp = care_xp + new.xp_earned where id = new.cat_id;
  update profiles set total_xp = total_xp + new.xp_earned where id = new.owner_id;
  return new;
end $$;

create trigger care_logs_apply_xp
  before insert on care_logs
  for each row execute function apply_care_log_xp();

-- Weight club milestones
create or replace function apply_weight_milestones()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  kg integer;
begin
  for kg in 1 .. floor(new.weight_kg)::integer loop
    insert into milestones (owner_id, cat_id, code, label, reached_at)
    values (new.owner_id, new.cat_id, 'weight_' || kg || 'kg', kg || ' kg Club', new.measured_at)
    on conflict (cat_id, code) do nothing;
  end loop;
  return new;
end $$;

create trigger weight_logs_milestones
  after insert on weight_logs
  for each row execute function apply_weight_milestones();

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------
create view cat_stats as
select
  c.id as cat_id,
  c.owner_id,
  c.name,
  c.title,
  c.care_xp,
  floor(sqrt(c.care_xp / 100.0))::integer as level,
  w.weight_kg as current_weight_kg,
  w.measured_at as last_weighed_at,
  case when c.target_adult_kg is null or c.target_adult_kg = 0 then null
       else least(100, round(100 * w.weight_kg / c.target_adult_kg)) end as growth_pct,
  (select p.taken_at from photos p where p.cat_id = c.id order by p.taken_at desc limit 1) as last_photo_at
from cats c
left join lateral (
  select weight_kg, measured_at from weight_logs
  where cat_id = c.id order by measured_at desc limit 1
) w on true;

create view growth_velocity as
select
  c.id as cat_id,
  c.owner_id,
  latest.weight_kg as current_kg,
  latest.weight_kg - d30.weight_kg as gain_30d_kg,
  latest.weight_kg - d58.weight_kg as gain_58d_kg
from cats c
left join lateral (select weight_kg from weight_logs where cat_id = c.id order by measured_at desc limit 1) latest on true
left join lateral (select weight_kg from weight_logs where cat_id = c.id and measured_at <= now() - interval '30 days' order by measured_at desc limit 1) d30 on true
left join lateral (select weight_kg from weight_logs where cat_id = c.id and measured_at <= now() - interval '58 days' order by measured_at desc limit 1) d58 on true;

create view owner_stats as
select
  p.id as owner_id,
  p.total_xp,
  floor(sqrt(p.total_xp / 100.0))::integer as level,
  case
    when floor(sqrt(p.total_xp / 100.0)) >= 30 then 'Feline Care Master'
    when floor(sqrt(p.total_xp / 100.0)) >= 20 then 'Cat Wellness Nerd'
    when floor(sqrt(p.total_xp / 100.0)) >= 10 then 'Responsible Cat Parent'
    when floor(sqrt(p.total_xp / 100.0)) >= 5  then 'Basic Caretaker'
    else 'Cat Caretaker'
  end as title
from profiles p;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table profiles            enable row level security;
alter table cats                enable row level security;
alter table care_logs           enable row level security;
alter table weight_logs         enable row level security;
alter table health_logs         enable row level security;
alter table health_records      enable row level security;
alter table photos              enable row level security;
alter table quest_templates     enable row level security;
alter table quest_completions   enable row level security;
alter table milestones          enable row level security;
alter table achievement_unlocks enable row level security;
alter table relationships       enable row level security;
alter table relationship_events enable row level security;
alter table insights            enable row level security;
alter table xp_rules            enable row level security;
alter table achievements        enable row level security;

create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array[
    'cats','care_logs','weight_logs','health_logs','health_records','photos',
    'quest_templates','quest_completions','milestones','achievement_unlocks',
    'relationships','relationship_events','insights'
  ] loop
    execute format(
      'create policy "owner rows" on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

create policy "read xp rules"     on xp_rules     for select using (auth.role() = 'authenticated');
create policy "read achievements" on achievements for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Storage bucket for photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "owner photos" on storage.objects
  for all using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

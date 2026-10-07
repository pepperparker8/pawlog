-- 001 Initial schema: households, members, cats, normalized logs, photos, care tasks, audit.
-- Every tenant-owned row carries household_id. Access is enforced in 002_rls.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type household_role as enum ('owner', 'caregiver', 'viewer');
create type cat_sex as enum ('male', 'female', 'unknown');
create type symptom_severity as enum ('mild', 'moderate', 'severe');
create type food_type as enum ('dry', 'wet', 'raw', 'treat', 'supplement', 'other');
create type care_task_kind as enum (
  'flea_tick', 'deworming', 'grooming', 'nail_trim', 'vaccination',
  'vet_visit', 'dental', 'medication', 'custom'
);
create type parasite_kind as enum ('flea_tick', 'deworming', 'heartworm', 'other');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Users and households
-- ---------------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_path  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();

create table households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger households_updated_at before update on households for each row execute function set_updated_at();

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id      uuid not null references profiles (id) on delete cascade,
  role         household_role not null default 'caregiver',
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on household_members (user_id);

create table household_invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  email        text not null,
  role         household_role not null default 'caregiver',
  token        text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_by   uuid not null references profiles (id),
  expires_at   timestamptz not null default now() + interval '14 days',
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index household_invites_household_idx on household_invites (household_id);

-- New auth user: profile + default household + owner membership.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  hid uuid;
  name text;
begin
  name := coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''),
                   nullif(new.raw_user_meta_data ->> 'name', ''),
                   split_part(coalesce(new.email, 'pawrent'), '@', 1));
  insert into profiles (id, display_name) values (new.id, name);
  insert into households (name, created_by) values ('My Cat Family', new.id) returning id into hid;
  insert into household_members (household_id, user_id, role) values (hid, new.id, 'owner');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Cats
-- ---------------------------------------------------------------------------
create table cats (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references households (id) on delete cascade,
  name             text not null,
  nickname         text,
  breed            text,
  color            text,
  sex              cat_sex not null default 'unknown',
  date_of_birth    date,
  dob_is_estimate  boolean not null default false,
  adopted_on       date,
  microchip_id     text,
  neutered         boolean,
  blood_type       text,
  allergies        text,
  known_conditions text,
  emergency_notes  text,
  vet_name         text,
  clinic_name      text,
  clinic_phone     text,
  profile_photo_id uuid,                 -- fk added after photos
  archived_at      timestamptz,
  deceased_on      date,
  created_by       uuid not null references profiles (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index cats_household_idx on cats (household_id, archived_at);
create trigger cats_updated_at before update on cats for each row execute function set_updated_at();

create table cat_favorites (
  user_id uuid not null references profiles (id) on delete cascade,
  cat_id  uuid not null references cats (id) on delete cascade,
  primary key (user_id, cat_id)
);

-- ---------------------------------------------------------------------------
-- Food
-- ---------------------------------------------------------------------------
create table food_profiles (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households (id) on delete cascade,
  brand          text,
  product        text not null,
  type           food_type not null default 'dry',
  kcal_per_100g  numeric(7,2) check (kcal_per_100g is null or kcal_per_100g >= 0),
  protein_pct    numeric(5,2) check (protein_pct is null or protein_pct between 0 and 100),
  fat_pct        numeric(5,2) check (fat_pct is null or fat_pct between 0 and 100),
  moisture_pct   numeric(5,2) check (moisture_pct is null or moisture_pct between 0 and 100),
  serving_size_g numeric(7,2) check (serving_size_g is null or serving_size_g > 0),
  archived_at    timestamptz,
  created_by     uuid not null references profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index food_profiles_household_idx on food_profiles (household_id);
create trigger food_profiles_updated_at before update on food_profiles for each row execute function set_updated_at();

create table feeding_plans (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households (id) on delete cascade,
  cat_id         uuid not null references cats (id) on delete cascade,
  food_id        uuid references food_profiles (id) on delete set null,
  times_per_day  smallint check (times_per_day is null or times_per_day between 1 and 12),
  amount_g       numeric(7,2) check (amount_g is null or amount_g > 0),
  notes          text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index feeding_plans_cat_idx on feeding_plans (cat_id, active);
create trigger feeding_plans_updated_at before update on feeding_plans for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Medical reference records
-- ---------------------------------------------------------------------------
create table cat_medications (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  cat_id       uuid not null references cats (id) on delete cascade,
  name         text not null,
  dose         text,
  frequency    text,                      -- "twice daily", "every 12h"
  times_per_day smallint check (times_per_day is null or times_per_day between 1 and 12),
  start_on     date,
  end_on       date check (end_on is null or start_on is null or end_on >= start_on),
  reason       text,
  active       boolean not null default true,
  created_by   uuid not null references profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index cat_medications_cat_idx on cat_medications (cat_id, active);
create trigger cat_medications_updated_at before update on cat_medications for each row execute function set_updated_at();

create table cat_conditions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  cat_id       uuid not null references cats (id) on delete cascade,
  name         text not null,              -- as told by the vet
  noted_on     date,
  status       text not null default 'active' check (status in ('active', 'resolved', 'monitoring')),
  notes        text,
  created_by   uuid not null references profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index cat_conditions_cat_idx on cat_conditions (cat_id, status);
create trigger cat_conditions_updated_at before update on cat_conditions for each row execute function set_updated_at();

create table vet_visits (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  cat_id       uuid not null references cats (id) on delete cascade,
  visited_on   date not null,
  clinic       text,
  vet_name     text,
  reason       text,
  findings     text,                       -- what the vet said, verbatim
  cost         numeric(12,2) check (cost is null or cost >= 0),
  currency     text,
  follow_up_on date,
  note         text,
  client_event_id uuid unique,
  created_by   uuid not null references profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index vet_visits_cat_idx on vet_visits (cat_id, visited_on desc);
create index vet_visits_household_idx on vet_visits (household_id, visited_on desc);
create trigger vet_visits_updated_at before update on vet_visits for each row execute function set_updated_at();

create table vaccination_records (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  cat_id       uuid not null references cats (id) on delete cascade,
  vaccine_name text not null,              -- F3, F4, Rabies, FeLV
  given_on     date not null check (given_on <= current_date),
  next_due_on  date check (next_due_on is null or next_due_on >= given_on),
  clinic       text,
  batch_no     text,
  vet_visit_id uuid references vet_visits (id) on delete set null,
  note         text,
  client_event_id uuid unique,
  created_by   uuid not null references profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index vaccination_records_cat_idx on vaccination_records (cat_id, given_on desc);
create index vaccination_records_due_idx on vaccination_records (household_id, next_due_on);
create trigger vaccination_records_updated_at before update on vaccination_records for each row execute function set_updated_at();

create table parasite_treatments (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  cat_id       uuid not null references cats (id) on delete cascade,
  kind         parasite_kind not null,
  product      text,
  given_on     date not null check (given_on <= current_date),
  next_due_on  date check (next_due_on is null or next_due_on >= given_on),
  note         text,
  client_event_id uuid unique,
  created_by   uuid not null references profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index parasite_treatments_cat_idx on parasite_treatments (cat_id, given_on desc);
create index parasite_treatments_due_idx on parasite_treatments (household_id, next_due_on);
create trigger parasite_treatments_updated_at before update on parasite_treatments for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Daily logs. Same shape everywhere: household_id, cat_id, logged_at, note,
-- client_event_id (idempotency for offline sync), created_by.
-- ---------------------------------------------------------------------------
create table weight_logs (
  id                   uuid primary key default gen_random_uuid(),
  household_id         uuid not null references households (id) on delete cascade,
  cat_id               uuid not null references cats (id) on delete cascade,
  logged_at            timestamptz not null default now(),
  weight_kg            numeric(6,3) not null check (weight_kg > 0 and weight_kg < 50),
  body_condition_score smallint check (body_condition_score is null or body_condition_score between 1 and 9),
  note                 text,
  client_event_id      uuid unique,
  created_by           uuid not null references profiles (id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index weight_logs_cat_time_idx on weight_logs (cat_id, logged_at desc);
create index weight_logs_household_time_idx on weight_logs (household_id, logged_at desc);
create trigger weight_logs_updated_at before update on weight_logs for each row execute function set_updated_at();

create table feeding_logs (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  logged_at       timestamptz not null default now(),
  food_id         uuid references food_profiles (id) on delete set null,
  food_name       text,                    -- free text when no profile
  amount          numeric(8,2) check (amount is null or amount > 0),
  unit            text check (unit is null or unit in ('g', 'ml', 'pouch', 'can', 'cup', 'piece', 'scoop')),
  estimated_kcal  numeric(8,2) check (estimated_kcal is null or estimated_kcal >= 0),
  appetite        smallint check (appetite is null or appetite between 0 and 5),
  note            text,
  client_event_id uuid unique,
  created_by      uuid not null references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index feeding_logs_cat_time_idx on feeding_logs (cat_id, logged_at desc);
create index feeding_logs_household_time_idx on feeding_logs (household_id, logged_at desc);
create trigger feeding_logs_updated_at before update on feeding_logs for each row execute function set_updated_at();

create table water_logs (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  logged_at       timestamptz not null default now(),
  action          text not null default 'refreshed' check (action in ('refreshed', 'checked', 'fountain_cleaned')),
  amount_ml       numeric(8,2) check (amount_ml is null or amount_ml >= 0),
  note            text,
  client_event_id uuid unique,
  created_by      uuid not null references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index water_logs_cat_time_idx on water_logs (cat_id, logged_at desc);
create index water_logs_household_time_idx on water_logs (household_id, logged_at desc);
create trigger water_logs_updated_at before update on water_logs for each row execute function set_updated_at();

create table litter_logs (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  logged_at       timestamptz not null default now(),
  action          text not null default 'scooped' check (action in ('scooped', 'cleaned', 'replaced', 'observed')),
  stool           text check (stool is null or stool in ('normal', 'soft', 'diarrhea', 'hard', 'blood', 'none')),
  urine           text check (urine is null or urine in ('normal', 'frequent', 'none', 'blood', 'large')),
  note            text,
  client_event_id uuid unique,
  created_by      uuid not null references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index litter_logs_cat_time_idx on litter_logs (cat_id, logged_at desc);
create index litter_logs_household_time_idx on litter_logs (household_id, logged_at desc);
create trigger litter_logs_updated_at before update on litter_logs for each row execute function set_updated_at();

create table symptom_logs (
  id                    uuid primary key default gen_random_uuid(),
  household_id          uuid not null references households (id) on delete cascade,
  cat_id                uuid not null references cats (id) on delete cascade,
  logged_at             timestamptz not null default now(),
  symptom               text not null,     -- sneezing, vomiting, lethargy
  severity              symptom_severity not null default 'mild',
  started_on            date,
  ended_on              date check (ended_on is null or started_on is null or ended_on >= started_on),
  frequency             text,              -- "3 times today"
  related_medication_id uuid references cat_medications (id) on delete set null,
  vet_visit_id          uuid references vet_visits (id) on delete set null,
  note                  text,
  client_event_id       uuid unique,
  created_by            uuid not null references profiles (id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index symptom_logs_cat_time_idx on symptom_logs (cat_id, logged_at desc);
create index symptom_logs_household_time_idx on symptom_logs (household_id, logged_at desc);
create index symptom_logs_symptom_idx on symptom_logs (household_id, lower(symptom));
create trigger symptom_logs_updated_at before update on symptom_logs for each row execute function set_updated_at();

create table medication_logs (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references households (id) on delete cascade,
  cat_id            uuid not null references cats (id) on delete cascade,
  logged_at         timestamptz not null default now(),
  cat_medication_id uuid references cat_medications (id) on delete set null,
  medication_name   text,
  dose              text,
  skipped           boolean not null default false,
  note              text,
  client_event_id   uuid unique,
  created_by        uuid not null references profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index medication_logs_cat_time_idx on medication_logs (cat_id, logged_at desc);
create index medication_logs_household_time_idx on medication_logs (household_id, logged_at desc);
create trigger medication_logs_updated_at before update on medication_logs for each row execute function set_updated_at();

create table grooming_logs (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  logged_at       timestamptz not null default now(),
  type            text not null default 'brush' check (type in ('brush', 'bath', 'nails', 'ears', 'teeth', 'eyes', 'trim', 'other')),
  duration_min    smallint check (duration_min is null or duration_min between 0 and 600),
  coat_condition  text,
  note            text,
  client_event_id uuid unique,
  created_by      uuid not null references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index grooming_logs_cat_time_idx on grooming_logs (cat_id, logged_at desc);
create index grooming_logs_household_time_idx on grooming_logs (household_id, logged_at desc);
create trigger grooming_logs_updated_at before update on grooming_logs for each row execute function set_updated_at();

create table behavior_logs (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  logged_at       timestamptz not null default now(),
  behavior        text not null,           -- hiding, vocalizing, playing, cuddling
  mood            text,
  intensity       smallint check (intensity is null or intensity between 1 and 5),
  note            text,
  client_event_id uuid unique,
  created_by      uuid not null references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index behavior_logs_cat_time_idx on behavior_logs (cat_id, logged_at desc);
create index behavior_logs_household_time_idx on behavior_logs (household_id, logged_at desc);
create trigger behavior_logs_updated_at before update on behavior_logs for each row execute function set_updated_at();

create table activity_logs (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  logged_at       timestamptz not null default now(),
  activity        text not null default 'play' check (activity in ('play', 'walk', 'training', 'enrichment', 'other')),
  duration_min    smallint check (duration_min is null or duration_min between 0 and 600),
  note            text,
  client_event_id uuid unique,
  created_by      uuid not null references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index activity_logs_cat_time_idx on activity_logs (cat_id, logged_at desc);
create index activity_logs_household_time_idx on activity_logs (household_id, logged_at desc);
create trigger activity_logs_updated_at before update on activity_logs for each row execute function set_updated_at();

create table journal_entries (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid references cats (id) on delete cascade,   -- null = household note
  logged_at       timestamptz not null default now(),
  title           text,
  body            text not null,
  client_event_id uuid unique,
  created_by      uuid not null references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index journal_entries_cat_time_idx on journal_entries (cat_id, logged_at desc);
create index journal_entries_household_time_idx on journal_entries (household_id, logged_at desc);
create trigger journal_entries_updated_at before update on journal_entries for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Photos
-- ---------------------------------------------------------------------------
create table photos (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  storage_path    text not null,           -- household/{household_id}/cats/{cat_id}/photos/{photo_id}.jpg
  thumbnail_path  text,
  medium_path     text,
  caption         text,
  tags            text[] not null default '{}',
  taken_at        timestamptz not null default now(),
  uploaded_at     timestamptz not null default now(),
  width           integer,
  height          integer,
  bytes           integer,
  is_favorite     boolean not null default false,
  linked_table    text,                    -- symptom_logs, grooming_logs, ...
  linked_id       uuid,
  client_event_id uuid unique,
  created_by      uuid not null references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index photos_cat_time_idx on photos (cat_id, taken_at desc);
create index photos_household_time_idx on photos (household_id, taken_at desc);
create index photos_tags_idx on photos using gin (tags);
create trigger photos_updated_at before update on photos for each row execute function set_updated_at();

alter table cats
  add constraint cats_profile_photo_fk foreign key (profile_photo_id) references photos (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Care scheduler
-- ---------------------------------------------------------------------------
create table care_tasks (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references households (id) on delete cascade,
  cat_id           uuid references cats (id) on delete cascade,   -- null = whole household
  name             text not null,
  kind             care_task_kind not null default 'custom',
  frequency_days   integer check (frequency_days is null or frequency_days > 0),
  next_due_on      date,
  assigned_to      uuid references profiles (id) on delete set null,
  reminder_enabled boolean not null default true,
  active           boolean not null default true,
  created_by       uuid not null references profiles (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index care_tasks_household_due_idx on care_tasks (household_id, active, next_due_on);
create index care_tasks_cat_idx on care_tasks (cat_id);
create trigger care_tasks_updated_at before update on care_tasks for each row execute function set_updated_at();

create table care_task_completions (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  task_id         uuid not null references care_tasks (id) on delete cascade,
  cat_id          uuid references cats (id) on delete cascade,
  completed_at    timestamptz not null default now(),
  completed_by    uuid not null references profiles (id),
  note            text,
  client_event_id uuid unique,
  created_at      timestamptz not null default now()
);
create index care_task_completions_task_idx on care_task_completions (task_id, completed_at desc);
create index care_task_completions_household_idx on care_task_completions (household_id, completed_at desc);

-- Completing a recurring task rolls next_due_on forward.
create or replace function roll_care_task_forward()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update care_tasks
  set next_due_on = case when frequency_days is null then null
                         else (new.completed_at::date + frequency_days) end
  where id = new.task_id;
  return new;
end $$;

create trigger care_task_completions_roll
  after insert on care_task_completions
  for each row execute function roll_care_task_forward();

-- ---------------------------------------------------------------------------
-- Milestones (growth clubs, anniversaries)
-- ---------------------------------------------------------------------------
create table milestones (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  cat_id       uuid not null references cats (id) on delete cascade,
  code         text not null,              -- weight_2kg, first_photo, one_year
  label        text not null,
  reached_at   timestamptz not null default now(),
  unique (cat_id, code)
);
create index milestones_household_idx on milestones (household_id, reached_at desc);

create or replace function apply_weight_milestones()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  kg integer;
begin
  for kg in 1 .. floor(new.weight_kg)::integer loop
    insert into milestones (household_id, cat_id, code, label, reached_at)
    values (new.household_id, new.cat_id, 'weight_' || kg || 'kg', kg || ' kg Club', new.logged_at)
    on conflict (cat_id, code) do nothing;
  end loop;
  return new;
end $$;

create trigger weight_logs_milestones
  after insert on weight_logs
  for each row execute function apply_weight_milestones();

-- ---------------------------------------------------------------------------
-- Audit log: who did what in a shared household
-- ---------------------------------------------------------------------------
create table audit_logs (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  actor_id     uuid references profiles (id) on delete set null,
  action       text not null,              -- insert, update, delete
  entity       text not null,              -- table name
  entity_id    uuid not null,
  cat_id       uuid,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index audit_logs_household_time_idx on audit_logs (household_id, created_at desc);

create or replace function write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  row_data jsonb;
  hid uuid;
  cid uuid;
  eid uuid;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  hid := (row_data ->> 'household_id')::uuid;
  cid := (row_data ->> 'cat_id')::uuid;
  eid := (row_data ->> 'id')::uuid;
  if tg_table_name = 'cats' then cid := eid; end if;
  insert into audit_logs (household_id, actor_id, action, entity, entity_id, cat_id, details)
  values (hid, auth.uid(), lower(tg_op), tg_table_name, eid, cid,
          case when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
               else row_data end);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'cats','weight_logs','feeding_logs','water_logs','litter_logs','symptom_logs',
    'medication_logs','grooming_logs','behavior_logs','activity_logs','journal_entries',
    'photos','vet_visits','vaccination_records','parasite_treatments','cat_medications',
    'cat_conditions','care_tasks','care_task_completions'
  ] loop
    execute format('create trigger %I_audit after insert or update or delete on %I for each row execute function write_audit_log()', t, t);
  end loop;
end $$;

-- 011 Health context: sourced breed references, weight targets, body condition source, care tips.
-- Weight status is computed on read from these inputs. Nothing stores a "healthy" flag.

-- ---------------------------------------------------------------------------
-- Reference data (shared, read-only for users; maintained through migrations)
-- ---------------------------------------------------------------------------
create table breeds (
  code                text primary key check (code ~ '^[a-z0-9-]+$'),
  name                text not null,
  aliases             text[] not null default '{}',
  coat                text check (coat in ('short', 'semi-long', 'long', 'hairless')),
  maturity_months_min smallint check (maturity_months_min between 6 and 72),
  maturity_months_max smallint check (maturity_months_max between 6 and 72),
  growth_notes        text,
  maturity_notes      text,
  care_notes          text,
  source              text,
  source_url          text,
  last_reviewed       date
);

create table breed_weight_references (
  id            uuid primary key default gen_random_uuid(),
  breed_code    text not null references breeds (code) on delete cascade,
  sex           text not null default 'any' check (sex in ('any', 'female', 'male')),
  min_kg        numeric(5,2) not null check (min_kg > 0),
  max_kg        numeric(5,2) not null check (max_kg >= min_kg),
  source        text not null,
  source_url    text not null,
  last_reviewed date not null,
  unique (breed_code, sex, source)
);
create index breed_weight_references_breed_idx on breed_weight_references (breed_code);

create table care_tips (
  code          text primary key check (code ~ '^[a-z0-9-]+$'),
  kind          text not null check (kind in ('tip', 'fact', 'hint')),
  topic         text not null,
  icon          text,
  title         text not null,
  body          text not null,
  audience      jsonb not null default '{}'::jsonb,
  trigger       text,
  source        text not null,
  source_url    text not null,
  reviewed      date not null,
  active        boolean not null default true
);
create index care_tips_trigger_idx on care_tips (trigger) where trigger is not null;

alter table breeds enable row level security;
alter table breed_weight_references enable row level security;
alter table care_tips enable row level security;
create policy "breeds: read" on breeds for select to authenticated using (true);
create policy "breed refs: read" on breed_weight_references for select to authenticated using (true);
create policy "care tips: read" on care_tips for select to authenticated using (active);

-- ---------------------------------------------------------------------------
-- Cat links
-- ---------------------------------------------------------------------------
alter table cats add column breed_code text references breeds (code) on delete set null;
create index cats_breed_code_idx on cats (breed_code);

alter table weight_logs add column body_condition_source text
  check (body_condition_source is null or body_condition_source in ('vet', 'owner'));
alter table weight_logs add constraint weight_logs_bcs_source_chk
  check (body_condition_score is null or body_condition_source is not null) not valid;

-- ---------------------------------------------------------------------------
-- Weight targets: one active row per cat and source (vet or owner).
-- ---------------------------------------------------------------------------
create table cat_weight_targets (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households (id) on delete cascade,
  cat_id        uuid not null references cats (id) on delete cascade,
  source        text not null check (source in ('vet', 'owner')),
  min_kg        numeric(5,2) check (min_kg > 0 and min_kg < 50),
  max_kg        numeric(5,2) check (max_kg > 0 and max_kg < 50),
  target_kg     numeric(5,2) check (target_kg > 0 and target_kg < 50),
  set_on        date not null default current_date,
  note          text,
  archived_at   timestamptz,
  created_by    uuid not null default auth.uid() references profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (min_kg is null or max_kg is null or max_kg >= min_kg),
  check (coalesce(min_kg, max_kg, target_kg) is not null)
);
create unique index cat_weight_targets_active_uidx on cat_weight_targets (cat_id, source) where archived_at is null;
create index cat_weight_targets_household_idx on cat_weight_targets (household_id);
create index cat_weight_targets_created_by_idx on cat_weight_targets (created_by);
create trigger cat_weight_targets_updated_at before update on cat_weight_targets for each row execute function set_updated_at();
create trigger cat_weight_targets_tenant before insert or update on cat_weight_targets for each row execute function enforce_tenant_consistency();
create trigger cat_weight_targets_audit after insert or update or delete on cat_weight_targets for each row execute function write_audit_log();

alter table cat_weight_targets enable row level security;
create policy "cat_weight_targets: member read" on cat_weight_targets for select to authenticated using (is_household_member(household_id));
create policy "cat_weight_targets: editor insert" on cat_weight_targets for insert to authenticated with check (can_edit_household(household_id));
create policy "cat_weight_targets: editor update" on cat_weight_targets for update to authenticated using (can_edit_household(household_id)) with check (can_edit_household(household_id));
create policy "cat_weight_targets: editor delete" on cat_weight_targets for delete to authenticated using (can_edit_household(household_id));

grant select on breeds, breed_weight_references, care_tips to authenticated;
grant select, insert, update, delete on cat_weight_targets to authenticated;

-- Existing scores were entered by owners.
update weight_logs set body_condition_source = 'owner' where body_condition_score is not null and body_condition_source is null;
alter table weight_logs validate constraint weight_logs_bcs_source_chk;

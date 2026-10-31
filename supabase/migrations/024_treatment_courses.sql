-- 024 Treatment courses: a planned course of treatment for one cat, optionally tied to a condition.
-- Medications can belong to a course. Progress (day N of M, missed doses, weight and labs since start)
-- is computed in the app from existing logs.

create table treatment_courses (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  condition_id    uuid references cat_conditions (id) on delete set null,
  name            text not null check (char_length(name) between 1 and 120),
  started_on      date not null,
  planned_days    smallint check (planned_days is null or planned_days between 1 and 730),
  review_on       date,
  status          text not null default 'active' check (status in ('active', 'completed', 'stopped')),
  ended_on        date check (ended_on is null or ended_on >= started_on),
  note            text check (char_length(note) <= 2000),
  client_event_id uuid unique,
  created_by      uuid not null default auth.uid() references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index treatment_courses_cat_idx on treatment_courses (cat_id, started_on desc);
create index treatment_courses_household_idx on treatment_courses (household_id);
create index treatment_courses_condition_idx on treatment_courses (condition_id);
create index treatment_courses_created_by_idx on treatment_courses (created_by);

alter table cat_medications add column course_id uuid references treatment_courses (id) on delete set null;
create index cat_medications_course_idx on cat_medications (course_id);

-- A course's condition, and a medication's course, belong to the same cat.
create or replace function enforce_course_links()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'treatment_courses' then
    if new.condition_id is not null and not exists (select 1 from cat_conditions c where c.id = new.condition_id and c.cat_id = new.cat_id) then
      raise exception 'condition belongs to another cat';
    end if;
  elsif new.course_id is not null and not exists (select 1 from treatment_courses t where t.id = new.course_id and t.cat_id = new.cat_id) then
    raise exception 'course belongs to another cat';
  end if;
  return new;
end $$;

create trigger treatment_courses_tenant before insert or update on treatment_courses for each row execute function enforce_tenant_consistency();
create trigger treatment_courses_links before insert or update on treatment_courses for each row execute function enforce_course_links();
create trigger cat_medications_course_link before insert or update of course_id on cat_medications for each row execute function enforce_course_links();
create trigger treatment_courses_updated_at before update on treatment_courses for each row execute function set_updated_at();
create trigger treatment_courses_audit after insert or update or delete on treatment_courses for each row execute function write_audit_log();

alter table treatment_courses enable row level security;
create policy "treatment_courses: member read" on treatment_courses for select using (is_household_member(household_id));
create policy "treatment_courses: editor insert" on treatment_courses for insert with check (can_edit_household(household_id) and created_by = auth.uid());
create policy "treatment_courses: editor update" on treatment_courses for update using (can_edit_household(household_id)) with check (can_edit_household(household_id));
create policy "treatment_courses: editor delete" on treatment_courses for delete using (can_edit_household(household_id));

revoke execute on function enforce_course_links() from public, anon, authenticated;

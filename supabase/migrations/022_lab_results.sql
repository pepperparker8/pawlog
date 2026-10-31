-- Phase 8: lab results from a photo of the lab paper.
-- lab_reads logs each extraction call (daily cap, idempotent retry); its draft is kept 30 days.
-- lab_reports holds one confirmed lab paper; lab_results holds its rows exactly as printed.
-- The cropped image lives in the private cat-photos bucket at household/{hid}/cats/{cat}/labs/{report}.jpg,
-- which the existing cat-photos storage policies already cover.

create table lab_reads (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  client_event_id uuid not null unique,
  draft           jsonb,
  model           text,
  input_tokens    integer,
  output_tokens   integer,
  created_by      uuid not null default auth.uid() references profiles (id),
  created_at      timestamptz not null default now()
);
create index lab_reads_user_idx on lab_reads (created_by, created_at);
create index lab_reads_household_idx on lab_reads (household_id, created_at);
create index lab_reads_cat_idx on lab_reads (cat_id);

create table lab_reports (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  vet_visit_id    uuid references vet_visits (id) on delete set null,
  read_id         uuid references lab_reads (id) on delete set null,
  sampled_on      date not null,
  lab_name        text check (char_length(lab_name) <= 200),
  storage_path    text check (char_length(storage_path) <= 300),
  note            text check (char_length(note) <= 2000),
  client_event_id uuid unique,
  created_by      uuid not null default auth.uid() references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index lab_reports_cat_idx on lab_reports (cat_id, sampled_on desc);
create index lab_reports_household_idx on lab_reports (household_id);
create index lab_reports_visit_idx on lab_reports (vet_visit_id);
create index lab_reports_read_idx on lab_reports (read_id);
create index lab_reports_created_by_idx on lab_reports (created_by);

create table lab_results (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households (id) on delete cascade,
  cat_id        uuid not null references cats (id) on delete cascade,
  report_id     uuid not null references lab_reports (id) on delete cascade,
  position      smallint not null default 0,
  panel         text check (char_length(panel) <= 80),
  analyte       text not null check (char_length(analyte) between 1 and 120),
  analyte_key   text not null check (analyte_key ~ '^[a-z0-9_]{1,60}$'),
  value         numeric,
  value_text    text check (char_length(value_text) <= 80),
  unit          text check (char_length(unit) <= 40),
  ref_low       numeric,
  ref_high      numeric,
  ref_text      text check (char_length(ref_text) <= 80),
  printed_flag  text check (char_length(printed_flag) <= 20),
  about         text check (char_length(about) <= 300),
  created_by    uuid not null default auth.uid() references profiles (id),
  created_at    timestamptz not null default now(),
  check (value is not null or value_text is not null)
);
create index lab_results_trend_idx on lab_results (cat_id, analyte_key);
create index lab_results_report_idx on lab_results (report_id, position);
create index lab_results_household_idx on lab_results (household_id);
create index lab_results_created_by_idx on lab_results (created_by);

-- A result belongs to its report's cat; a report's vet visit belongs to the same cat.
create or replace function enforce_lab_links()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'lab_results' then
    if not exists (select 1 from lab_reports r where r.id = new.report_id and r.cat_id = new.cat_id) then
      raise exception 'result does not match its report';
    end if;
  elsif new.vet_visit_id is not null then
    if not exists (select 1 from vet_visits v where v.id = new.vet_visit_id and v.cat_id = new.cat_id) then
      raise exception 'vet visit belongs to another cat';
    end if;
  end if;
  return new;
end $$;

create trigger lab_reads_tenant before insert or update on lab_reads for each row execute function enforce_tenant_consistency();
create trigger lab_reports_tenant before insert or update on lab_reports for each row execute function enforce_tenant_consistency();
create trigger lab_results_tenant before insert or update on lab_results for each row execute function enforce_tenant_consistency();
create trigger lab_reports_links before insert or update on lab_reports for each row execute function enforce_lab_links();
create trigger lab_results_links before insert or update on lab_results for each row execute function enforce_lab_links();
create trigger lab_reports_updated_at before update on lab_reports for each row execute function set_updated_at();

alter table lab_reads enable row level security;
alter table lab_reports enable row level security;
alter table lab_results enable row level security;

create policy "lab_reads: own read" on lab_reads for select using (created_by = auth.uid() and is_household_member(household_id));
create policy "lab_reads: editor insert" on lab_reads for insert with check (can_edit_household(household_id) and created_by = auth.uid());
create policy "lab_reads: editor update" on lab_reads for update using (created_by = auth.uid() and can_edit_household(household_id));
create policy "lab_reads: editor delete" on lab_reads for delete using (can_edit_household(household_id));

create policy "lab_reports: member read" on lab_reports for select using (is_household_member(household_id));
create policy "lab_reports: editor insert" on lab_reports for insert with check (can_edit_household(household_id) and created_by = auth.uid());
create policy "lab_reports: editor update" on lab_reports for update using (can_edit_household(household_id));
create policy "lab_reports: editor delete" on lab_reports for delete using (can_edit_household(household_id));

create policy "lab_results: member read" on lab_results for select using (is_household_member(household_id));
create policy "lab_results: editor insert" on lab_results for insert with check (can_edit_household(household_id) and created_by = auth.uid());
create policy "lab_results: editor update" on lab_results for update using (can_edit_household(household_id));
create policy "lab_results: editor delete" on lab_results for delete using (can_edit_household(household_id));

-- Saves a confirmed report and its rows in one transaction, optionally creating the vet visit it came from.
-- Runs as the caller, so the policies above decide what is allowed. A repeated client_event_id returns the saved report.
create or replace function save_lab_report(p jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_id      uuid := (p ->> 'id')::uuid;
  v_event   uuid := (p ->> 'client_event_id')::uuid;
  v_hid     uuid := (p ->> 'household_id')::uuid;
  v_cat     uuid := (p ->> 'cat_id')::uuid;
  v_visit   uuid := nullif(p ->> 'vet_visit_id', '')::uuid;
  v_existing uuid;
  r         jsonb;
  i         integer := 0;
begin
  select id into v_existing from lab_reports where client_event_id = v_event;
  if v_existing is not null then return v_existing; end if;
  if jsonb_typeof(p -> 'rows') <> 'array' or jsonb_array_length(p -> 'rows') = 0 then
    raise exception 'a lab report needs at least one result';
  end if;

  if p ? 'new_visit' and jsonb_typeof(p -> 'new_visit') = 'object' then
    insert into vet_visits (household_id, cat_id, visited_on, clinic, reason, client_event_id)
    values (v_hid, v_cat, (p ->> 'sampled_on')::date, nullif(p -> 'new_visit' ->> 'clinic', ''),
            nullif(p -> 'new_visit' ->> 'reason', ''), gen_random_uuid())
    returning id into v_visit;
  end if;

  insert into lab_reports (id, household_id, cat_id, vet_visit_id, read_id, sampled_on, lab_name, storage_path, client_event_id)
  values (v_id, v_hid, v_cat, v_visit, nullif(p ->> 'read_id', '')::uuid, (p ->> 'sampled_on')::date,
          nullif(p ->> 'lab_name', ''), nullif(p ->> 'storage_path', ''), v_event);

  for r in select * from jsonb_array_elements(p -> 'rows') loop
    insert into lab_results (household_id, cat_id, report_id, position, panel, analyte, analyte_key, value, value_text,
                             unit, ref_low, ref_high, ref_text, printed_flag, about)
    values (v_hid, v_cat, v_id, i, nullif(r ->> 'panel', ''), r ->> 'analyte', r ->> 'analyte_key',
            (r ->> 'value')::numeric, nullif(r ->> 'value_text', ''), nullif(r ->> 'unit', ''),
            (r ->> 'ref_low')::numeric, (r ->> 'ref_high')::numeric, nullif(r ->> 'ref_text', ''),
            nullif(r ->> 'printed_flag', ''), nullif(r ->> 'about', ''));
    i := i + 1;
  end loop;
  return v_id;
end $$;

revoke execute on function save_lab_report(jsonb) from public, anon;
grant execute on function save_lab_report(jsonb) to authenticated;
revoke execute on function enforce_lab_links() from public, anon, authenticated;

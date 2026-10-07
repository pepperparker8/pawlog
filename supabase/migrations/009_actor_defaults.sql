-- 009 Actor columns default to the caller.
-- The client never sends created_by / completed_by; the tenant trigger overwrites them anyway.
-- household_invites and care_task_completions previously had no way to fill them.

do $$
declare r record;
begin
  for r in
    select table_name, column_name from information_schema.columns
    where table_schema = 'public' and column_name in ('created_by', 'completed_by')
      and table_name in (select tablename from pg_tables where schemaname = 'public')
  loop
    execute format('alter table %I alter column %I set default auth.uid()', r.table_name, r.column_name);
  end loop;
end $$;

create or replace function enforce_tenant_consistency()
returns trigger language plpgsql set search_path = public as $$
declare
  cat_hid uuid;
begin
  if tg_op = 'INSERT' and to_jsonb(new) ? 'created_by' then
    new.created_by := auth.uid();
  end if;
  if tg_op = 'INSERT' and to_jsonb(new) ? 'completed_by' then
    new.completed_by := auth.uid();
  end if;
  if to_jsonb(new) ? 'cat_id' and (to_jsonb(new) ->> 'cat_id') is not null then
    select household_id into cat_hid from cats where id = (to_jsonb(new) ->> 'cat_id')::uuid;
    if cat_hid is null or cat_hid <> (to_jsonb(new) ->> 'household_id')::uuid then
      raise exception 'cat does not belong to this household';
    end if;
  end if;
  return new;
end $$;

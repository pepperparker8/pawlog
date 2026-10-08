-- 018 Reminder refresh: household-scoped sweep the app runs on open, in-app links that resolve,
-- latest record per vaccine and parasite kind, overdue items included, archived cats skipped.

create or replace function sweep_household_reminders(p_household uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer := 0;
  r record;
  today date := (now() at time zone 'Asia/Jakarta')::date;
  v_title text;
  v_link text;
begin
  for r in
    select t.cat_id, t.name, t.next_due_on, c.name as cat_name
    from care_tasks t left join cats c on c.id = t.cat_id
    where t.household_id = p_household and t.active and t.reminder_enabled
      and t.next_due_on is not null and t.next_due_on <= today
      and (t.cat_id is null or c.archived_at is null)
  loop
    v_title := r.name || coalesce(' for ' || r.cat_name, '');
    if not exists (select 1 from notifications x where x.household_id = p_household and x.kind = 'reminder'
                   and x.title = v_title and (x.created_at at time zone 'Asia/Jakarta')::date = today) then
      perform notify_household(p_household, r.cat_id, 'reminder', v_title,
        case when r.next_due_on < today then format('Overdue since %s', to_char(r.next_due_on, 'DD Mon')) else 'Due today' end, '/more/care');
      n := n + 1;
    end if;
  end loop;

  for r in
    select distinct on (v.cat_id, lower(v.vaccine_name)) v.cat_id, v.vaccine_name, v.next_due_on, c.name as cat_name
    from vaccination_records v join cats c on c.id = v.cat_id
    where v.household_id = p_household and c.archived_at is null and c.deceased_on is null
    order by v.cat_id, lower(v.vaccine_name), v.given_on desc
  loop
    continue when r.next_due_on is null or r.next_due_on > today + 14;
    v_title := r.vaccine_name || ' due for ' || r.cat_name;
    v_link := '/cats/' || r.cat_id || '/health';
    if not exists (select 1 from notifications x where x.household_id = p_household and x.kind = 'reminder'
                   and x.title = v_title and (x.created_at at time zone 'Asia/Jakarta')::date = today) then
      perform notify_household(p_household, r.cat_id, 'reminder', v_title,
        case when r.next_due_on < today then format('Overdue since %s', to_char(r.next_due_on, 'DD Mon')) else format('Due %s', to_char(r.next_due_on, 'DD Mon')) end, v_link);
      n := n + 1;
    end if;
  end loop;

  for r in
    select distinct on (p.cat_id, p.kind) p.cat_id, p.kind, p.next_due_on, c.name as cat_name
    from parasite_treatments p join cats c on c.id = p.cat_id
    where p.household_id = p_household and c.archived_at is null and c.deceased_on is null
    order by p.cat_id, p.kind, p.given_on desc
  loop
    continue when r.next_due_on is null or r.next_due_on > today + 7;
    v_title := case r.kind when 'flea_tick' then 'Flea and tick treatment' when 'deworming' then 'Deworming'
                 when 'heartworm' then 'Heartworm prevention' else 'Parasite treatment' end || ' due for ' || r.cat_name;
    v_link := '/cats/' || r.cat_id || '/health';
    if not exists (select 1 from notifications x where x.household_id = p_household and x.kind = 'reminder'
                   and x.title = v_title and (x.created_at at time zone 'Asia/Jakarta')::date = today) then
      perform notify_household(p_household, r.cat_id, 'reminder', v_title,
        case when r.next_due_on < today then format('Overdue since %s', to_char(r.next_due_on, 'DD Mon')) else format('Due %s', to_char(r.next_due_on, 'DD Mon')) end, v_link);
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke execute on function sweep_household_reminders(uuid) from public, anon, authenticated;

-- Called by the app when a household opens. Idempotent per day.
create or replace function refresh_reminders(p_household uuid)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if not is_household_member(p_household) then
    raise exception 'not a member' using errcode = '42501';
  end if;
  return sweep_household_reminders(p_household);
end $$;
revoke execute on function refresh_reminders(uuid) from public, anon;
grant execute on function refresh_reminders(uuid) to authenticated;

-- Daily sweep across households, for a scheduler if one is added later.
create or replace function sweep_reminders()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer := 0; h uuid;
begin
  for h in select id from households loop
    n := n + sweep_household_reminders(h);
  end loop;
  return n;
end $$;
revoke execute on function sweep_reminders() from public, anon, authenticated;

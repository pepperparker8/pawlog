-- 005 Notifications, reminders, activity feed, realtime publication.

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  user_id      uuid not null references profiles (id) on delete cascade,
  cat_id       uuid references cats (id) on delete cascade,
  kind         text not null,            -- reminder, pattern, badge, level_up, member, quest
  title        text not null,
  body         text,
  link         text,                     -- in-app route
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read_at, created_at desc);
alter table notifications enable row level security;
create policy "notifications: self read" on notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications: self update" on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications: self delete" on notifications for delete to authenticated using (user_id = auth.uid());

create table notification_preferences (
  user_id            uuid primary key references profiles (id) on delete cascade,
  reminders          boolean not null default true,
  patterns           boolean not null default true,
  gamification       boolean not null default true,
  household_activity boolean not null default true,
  quiet_from         time,
  quiet_to           time,
  updated_at         timestamptz not null default now()
);
alter table notification_preferences enable row level security;
create policy "notification_preferences: self" on notification_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function notify_household(p_household uuid, p_cat uuid, p_kind text, p_title text, p_body text, p_link text,
                                            p_only_user uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (household_id, user_id, cat_id, kind, title, body, link)
  select p_household, m.user_id, p_cat, p_kind, p_title, p_body, p_link
  from household_members m
  left join notification_preferences np on np.user_id = m.user_id
  where m.household_id = p_household
    and (p_only_user is null or m.user_id = p_only_user)
    and case p_kind
          when 'reminder' then coalesce(np.reminders, true)
          when 'pattern'  then coalesce(np.patterns, true)
          when 'badge'    then coalesce(np.gamification, true)
          when 'level_up' then coalesce(np.gamification, true)
          when 'quest'    then coalesce(np.gamification, true)
          else coalesce(np.household_activity, true)
        end;
end $$;

-- Level up and badge notifications (personal, so inserted directly)
create or replace function notify_level_up()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if new.level > old.level then
    select title into t from level_config where level = new.level;
    insert into notifications (household_id, user_id, kind, title, body, link)
    select household_id, new.user_id, 'level_up', format('Level %s: %s', new.level, t), 'Your care keeps paying off.', '/more/achievements'
    from household_members where user_id = new.user_id limit 1;
  end if;
  return new;
end $$;
create trigger user_stats_level_up after update of level on user_stats
  for each row execute function notify_level_up();

create or replace function notify_badge()
returns trigger language plpgsql security definer set search_path = public as $$
declare b badges;
begin
  select * into b from badges where code = new.badge_code;
  insert into notifications (household_id, user_id, cat_id, kind, title, body, link)
  select coalesce(nullif(new.household_id, '00000000-0000-0000-0000-000000000000'), m.household_id), new.user_id,
         nullif(new.cat_id, '00000000-0000-0000-0000-000000000000'), 'badge', 'Badge earned: ' || b.name, b.description, '/more/achievements'
  from household_members m where m.user_id = new.user_id limit 1;
  return new;
end $$;
create trigger user_badges_notify after insert on user_badges
  for each row execute function notify_badge();

-- Household activity: other members see what was logged.
create or replace function notify_member_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor text;
  cat_name text;
  j jsonb := to_jsonb(new);
  actor_id uuid := coalesce((j ->> 'created_by')::uuid, (j ->> 'completed_by')::uuid);
begin
  if actor_id is null then return new; end if;
  select display_name into actor from profiles where id = actor_id;
  select name into cat_name from cats where id = (j ->> 'cat_id')::uuid;
  insert into notifications (household_id, user_id, cat_id, kind, title, body, link)
  select new.household_id, m.user_id, (j ->> 'cat_id')::uuid, 'activity',
         format('%s logged %s', actor, replace(replace(tg_table_name, '_logs', ''), '_', ' ')),
         cat_name, '/timeline'
  from household_members m
  left join notification_preferences np on np.user_id = m.user_id
  where m.household_id = new.household_id and m.user_id <> actor_id and coalesce(np.household_activity, true);
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['symptom_logs','medication_logs','vet_visits','vaccination_records','care_task_completions'] loop
    execute format('create trigger %I_notify after insert on %I for each row execute function notify_member_activity()', t, t);
  end loop;
end $$;

-- Reminder sweep: due care tasks, vaccines, parasite treatments. Run daily (pg_cron or edge function).
create or replace function sweep_reminders()
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer := 0;
  r record;
  today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  for r in
    select t.household_id, t.cat_id, t.id, t.name, t.next_due_on, c.name as cat_name
    from care_tasks t left join cats c on c.id = t.cat_id
    where t.active and t.reminder_enabled and t.next_due_on is not null and t.next_due_on <= today
      and not exists (select 1 from notifications x where x.kind = 'reminder' and x.link = '/care/' || t.id and x.created_at::date = today)
  loop
    perform notify_household(r.household_id, r.cat_id, 'reminder', r.name || coalesce(' for ' || r.cat_name, ''),
      case when r.next_due_on < today then format('Overdue since %s', r.next_due_on) else 'Due today' end, '/care/' || r.id);
    n := n + 1;
  end loop;

  for r in
    select v.household_id, v.cat_id, v.id, v.vaccine_name, v.next_due_on, c.name as cat_name
    from vaccination_records v join cats c on c.id = v.cat_id
    where v.next_due_on between today and today + 14 and c.archived_at is null
      and not exists (select 1 from notifications x where x.kind = 'reminder' and x.link = '/cats/' || v.cat_id || '/health' and x.created_at::date = today)
  loop
    perform notify_household(r.household_id, r.cat_id, 'reminder', r.vaccine_name || ' due for ' || r.cat_name,
      format('Due %s', r.next_due_on), '/cats/' || r.cat_id || '/health');
    n := n + 1;
  end loop;

  for r in
    select p.household_id, p.cat_id, p.id, p.kind, p.next_due_on, c.name as cat_name
    from parasite_treatments p join cats c on c.id = p.cat_id
    where p.next_due_on between today and today + 7 and c.archived_at is null
      and not exists (select 1 from notifications x where x.kind = 'reminder' and x.link = '/cats/' || p.cat_id || '/care' and x.created_at::date = today)
  loop
    perform notify_household(r.household_id, r.cat_id, 'reminder', initcap(replace(r.kind::text, '_', ' ')) || ' due for ' || r.cat_name,
      format('Due %s', r.next_due_on), '/cats/' || r.cat_id || '/care');
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function sweep_reminders() from public;

-- Realtime
alter publication supabase_realtime add table notifications, cats, weight_logs, feeding_logs, water_logs,
  litter_logs, symptom_logs, medication_logs, grooming_logs, behavior_logs, activity_logs,
  journal_entries, photos, care_tasks, care_task_completions, xp_transactions, user_stats, household_stats, cat_stats;

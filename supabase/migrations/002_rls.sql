-- 002 Row Level Security. Tenant boundary = household membership.
-- Roles: owner (manage household + members), caregiver (log/edit), viewer (read only).

-- ---------------------------------------------------------------------------
-- Membership helpers. SECURITY DEFINER so the policies on household_members
-- do not recurse into themselves.
-- ---------------------------------------------------------------------------
create or replace function is_household_member(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create or replace function household_role_of(hid uuid)
returns household_role language sql stable security definer set search_path = public as $$
  select role from household_members
  where household_id = hid and user_id = auth.uid();
$$;

create or replace function can_edit_household(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(household_role_of(hid) in ('owner', 'caregiver'), false);
$$;

create or replace function is_household_owner(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(household_role_of(hid) = 'owner', false);
$$;

create or replace function my_household_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select household_id from household_members where user_id = auth.uid();
$$;

revoke execute on function is_household_member(uuid), household_role_of(uuid),
  can_edit_household(uuid), is_household_owner(uuid), my_household_ids() from public;
grant execute on function is_household_member(uuid), household_role_of(uuid),
  can_edit_household(uuid), is_household_owner(uuid), my_household_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles: self read" on profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles: household peers read" on profiles
  for select to authenticated using (
    exists (
      select 1 from household_members a
      join household_members b on a.household_id = b.household_id
      where a.user_id = auth.uid() and b.user_id = profiles.id
    )
  );

create policy "profiles: self update" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- households
-- ---------------------------------------------------------------------------
alter table households enable row level security;

create policy "households: members read" on households
  for select to authenticated using (is_household_member(id));

create policy "households: owner update" on households
  for update to authenticated using (is_household_owner(id)) with check (is_household_owner(id));

create policy "households: owner delete" on households
  for delete to authenticated using (is_household_owner(id));

-- Creating extra households goes through create_household() so the creator
-- becomes owner atomically.
create or replace function create_household(p_name text)
returns households language plpgsql security definer set search_path = public as $$
declare
  h households;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into households (name, created_by) values (p_name, auth.uid()) returning * into h;
  insert into household_members (household_id, user_id, role) values (h.id, auth.uid(), 'owner');
  return h;
end $$;
revoke execute on function create_household(text) from public;
grant execute on function create_household(text) to authenticated;

-- ---------------------------------------------------------------------------
-- household_members
-- ---------------------------------------------------------------------------
alter table household_members enable row level security;

create policy "members: members read" on household_members
  for select to authenticated using (is_household_member(household_id));

create policy "members: owner manage" on household_members
  for update to authenticated using (is_household_owner(household_id)) with check (is_household_owner(household_id));

create policy "members: owner remove or self leave" on household_members
  for delete to authenticated using (is_household_owner(household_id) or user_id = auth.uid());

-- Inserts only through invite acceptance / create_household (security definer).

-- ---------------------------------------------------------------------------
-- household_invites
-- ---------------------------------------------------------------------------
alter table household_invites enable row level security;

create policy "invites: owner read" on household_invites
  for select to authenticated using (is_household_owner(household_id));

create policy "invites: owner create" on household_invites
  for insert to authenticated with check (is_household_owner(household_id) and created_by = auth.uid());

create policy "invites: owner delete" on household_invites
  for delete to authenticated using (is_household_owner(household_id));

create or replace function accept_invite(p_token text)
returns households language plpgsql security definer set search_path = public as $$
declare
  inv household_invites;
  h households;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select * into inv from household_invites
  where token = p_token and accepted_at is null and expires_at > now();
  if not found then
    raise exception 'invite not found or expired';
  end if;
  insert into household_members (household_id, user_id, role)
  values (inv.household_id, auth.uid(), inv.role)
  on conflict (household_id, user_id) do update set role = excluded.role;
  update household_invites set accepted_at = now() where id = inv.id;
  select * into h from households where id = inv.household_id;
  return h;
end $$;
revoke execute on function accept_invite(text) from public;
grant execute on function accept_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Generic tenant policies for every table that carries household_id.
-- read: any member. write: owner or caregiver. delete: owner or caregiver.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'cats','food_profiles','feeding_plans','cat_medications','cat_conditions',
    'vet_visits','vaccination_records','parasite_treatments',
    'weight_logs','feeding_logs','water_logs','litter_logs','symptom_logs',
    'medication_logs','grooming_logs','behavior_logs','activity_logs','journal_entries',
    'photos','care_tasks','care_task_completions','milestones'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "%s: member read" on %I for select to authenticated using (is_household_member(household_id))', t, t);
    execute format(
      'create policy "%s: editor insert" on %I for insert to authenticated with check (can_edit_household(household_id))', t, t);
    execute format(
      'create policy "%s: editor update" on %I for update to authenticated using (can_edit_household(household_id)) with check (can_edit_household(household_id))', t, t);
    execute format(
      'create policy "%s: editor delete" on %I for delete to authenticated using (can_edit_household(household_id))', t, t);
  end loop;
end $$;

-- Milestones are written by triggers only.
drop policy "milestones: editor insert" on milestones;
drop policy "milestones: editor update" on milestones;
drop policy "milestones: editor delete" on milestones;

-- Favorites are per user.
alter table cat_favorites enable row level security;
create policy "favorites: self" on cat_favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Audit log: members read, nobody writes directly (trigger is security definer).
alter table audit_logs enable row level security;
create policy "audit: member read" on audit_logs
  for select to authenticated using (is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- Guard: created_by must be the caller, and cat must belong to the same household.
-- ---------------------------------------------------------------------------
create or replace function enforce_tenant_consistency()
returns trigger language plpgsql as $$
declare
  cat_hid uuid;
begin
  if tg_op = 'INSERT' and to_jsonb(new) ? 'created_by' then
    new.created_by := auth.uid();
  end if;
  if to_jsonb(new) ? 'cat_id' and (to_jsonb(new) ->> 'cat_id') is not null then
    select household_id into cat_hid from cats where id = (to_jsonb(new) ->> 'cat_id')::uuid;
    if cat_hid is null or cat_hid <> (to_jsonb(new) ->> 'household_id')::uuid then
      raise exception 'cat does not belong to this household';
    end if;
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'cats','food_profiles','feeding_plans','cat_medications','cat_conditions',
    'vet_visits','vaccination_records','parasite_treatments',
    'weight_logs','feeding_logs','water_logs','litter_logs','symptom_logs',
    'medication_logs','grooming_logs','behavior_logs','activity_logs','journal_entries',
    'photos','care_tasks','care_task_completions'
  ] loop
    execute format('create trigger %I_tenant before insert or update on %I for each row execute function enforce_tenant_consistency()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: bucket "cat-photos", path household/{household_id}/cats/{cat_id}/photos/{file}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cat-photos', 'cat-photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

create policy "cat-photos: member read" on storage.objects
  for select to authenticated using (
    bucket_id = 'cat-photos'
    and (storage.foldername(name))[1] = 'household'
    and is_household_member(((storage.foldername(name))[2])::uuid)
  );

create policy "cat-photos: editor write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'cat-photos'
    and (storage.foldername(name))[1] = 'household'
    and can_edit_household(((storage.foldername(name))[2])::uuid)
  );

create policy "cat-photos: editor update" on storage.objects
  for update to authenticated using (
    bucket_id = 'cat-photos'
    and (storage.foldername(name))[1] = 'household'
    and can_edit_household(((storage.foldername(name))[2])::uuid)
  );

create policy "cat-photos: editor delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'cat-photos'
    and (storage.foldername(name))[1] = 'household'
    and can_edit_household(((storage.foldername(name))[2])::uuid)
  );

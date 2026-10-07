-- RLS smoke test. Run in the SQL editor (or psql) as postgres. Every block must raise or return 0 rows where noted.
-- Scenario: User A (household A) must never read, insert into, or update Household B.
begin;

-- two fake users
insert into auth.users (id, email, raw_user_meta_data, instance_id, aud, role)
values ('00000000-0000-0000-0000-00000000000a', 'a@test.local', '{"display_name":"A"}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
       ('00000000-0000-0000-0000-00000000000b', 'b@test.local', '{"display_name":"B"}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');
-- handle_new_user created one household per user
select household_id as hid_a from household_members where user_id = '00000000-0000-0000-0000-00000000000a' \gset
select household_id as hid_b from household_members where user_id = '00000000-0000-0000-0000-00000000000b' \gset

-- B adds a cat
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
insert into cats (household_id, name) values (:'hid_b', 'Secret Cat');

-- A looks around
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from cats where name = 'Secret Cat') <> 0 then raise exception 'FAIL: A can read B''s cat'; end if;
  if (select count(*) from households where id = :'hid_b') <> 0 then raise exception 'FAIL: A can read household B'; end if;
end $$;

-- A tries to insert into B (must fail with RLS / tenant check)
do $$ begin
  begin
    insert into cats (household_id, name) values (:'hid_b', 'Intruder');
    raise exception 'FAIL: A inserted into household B';
  exception when insufficient_privilege or check_violation then null; end;
end $$;

-- A tries to log for B's cat via their own household (tenant consistency trigger)
do $$ declare cid uuid; begin
  select id into cid from cats where name = 'Secret Cat';   -- null under RLS
  if cid is not null then raise exception 'FAIL: A resolved B''s cat id'; end if;
end $$;

-- viewer cannot write
reset role;
insert into household_members (household_id, user_id, role) values (:'hid_b', '00000000-0000-0000-0000-00000000000a', 'viewer');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from cats where name = 'Secret Cat') <> 1 then raise exception 'FAIL: viewer cannot read'; end if;
  begin
    insert into weight_logs (household_id, cat_id, weight_kg) select household_id, id, 3 from cats where name = 'Secret Cat';
    raise exception 'FAIL: viewer inserted a log';
  exception when insufficient_privilege then null; end;
end $$;

-- XP idempotency: same client_event_id twice → one transaction
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
insert into weight_logs (household_id, cat_id, weight_kg, client_event_id) select household_id, id, 3.2, '11111111-1111-1111-1111-111111111111' from cats where name = 'Secret Cat';
do $$ begin
  begin
    insert into weight_logs (household_id, cat_id, weight_kg, client_event_id) select household_id, id, 3.2, '11111111-1111-1111-1111-111111111111' from cats where name = 'Secret Cat';
    raise exception 'FAIL: duplicate client_event_id accepted';
  exception when unique_violation then null; end;
  if (select count(*) from xp_transactions where user_id = '00000000-0000-0000-0000-00000000000b' and event_type = 'weight_logs') <> 1 then raise exception 'FAIL: xp not exactly once'; end if;
end $$;

select 'ALL RLS TESTS PASSED' as result;
rollback;

-- 006 Demo seed. seed_demo_household(user) builds a realistic household for the caller.
-- Nothing in the app is hard-coded to these cats; delete the household to remove them.

create or replace function seed_demo_household(p_name text default 'Demo Cat Family')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  hid uuid;
  cat_ids uuid[] := '{}';
  cid uuid;
  i integer;
  d integer;
  base_kg numeric;
  spec record;
  food_dry uuid;
  food_wet uuid;
  rnd double precision;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  insert into households (name, created_by) values (p_name, uid) returning id into hid;
  insert into household_members (household_id, user_id, role) values (hid, uid, 'owner');

  insert into food_profiles (household_id, brand, product, type, kcal_per_100g, protein_pct, created_by)
  values (hid, 'Royal Canin', 'Indoor Adult', 'dry', 375, 27, uid) returning id into food_dry;
  insert into food_profiles (household_id, brand, product, type, kcal_per_100g, protein_pct, created_by)
  values (hid, 'Whiskas', 'Tuna Pouch', 'wet', 80, 8, uid) returning id into food_wet;

  for spec in
    select * from (values
      ('Milo',   'Domestic Shorthair', 'Orange tabby', 'male',   current_date - 700, 3.5),
      ('Gipi',   'Domestic Shorthair', 'Calico',       'female', current_date - 150, 1.3),
      ('Luna',   'British Shorthair',  'Blue',         'female', current_date - 1400, 4.2),
      ('Oreo',   'Domestic Shorthair', 'Tuxedo',       'male',   current_date - 2200, 5.1),
      ('Mochi',  'Scottish Fold',      'Cream',        'female', current_date - 400, 3.0),
      ('Simba',  'Maine Coon',         'Red',          'male',   current_date - 1100, 6.4),
      ('Nala',   'Siamese',            'Seal point',   'female', current_date - 900, 3.8),
      ('Tofu',   'Domestic Longhair',  'White',        'male',   current_date - 60, 0.7),
      ('Pepper', 'Bengal',             'Brown rosette','female', current_date - 3000, 4.6)
    ) as v(name, breed, color, sex, dob, kg)
  loop
    insert into cats (household_id, name, breed, color, sex, date_of_birth, neutered, created_by)
    values (hid, spec.name, spec.breed, spec.color, spec.sex::cat_sex, spec.dob, spec.dob < current_date - 240, uid)
    returning id into cid;
    cat_ids := cat_ids || cid;
    base_kg := spec.kg;

    -- weights: weekly for 24 weeks, kittens grow, adults drift a little
    for i in reverse 24 .. 0 loop
      rnd := (hashtext(spec.name || i) % 100) / 1000.0;
      insert into weight_logs (household_id, cat_id, logged_at, weight_kg, created_by)
      values (hid, cid, now() - make_interval(weeks => i) - interval '9 hours',
              round((case when spec.dob > current_date - 365
                            then greatest(0.3, base_kg - i * base_kg / 40.0)
                            else base_kg - i * 0.005 end + rnd)::numeric, 2), uid);
    end loop;

    -- daily feeding + litter for the last 21 days
    for d in reverse 21 .. 0 loop
      insert into feeding_logs (household_id, cat_id, logged_at, food_id, food_name, amount, unit, appetite, created_by)
      values (hid, cid, now() - make_interval(days => d) - interval '15 hours', food_dry, 'Indoor Adult', 40, 'g',
              case when spec.name = 'Luna' and d < 3 then 2 else 4 + (hashtext(spec.name || d) % 2) end, uid);
      insert into feeding_logs (household_id, cat_id, logged_at, food_id, food_name, amount, unit, appetite, created_by)
      values (hid, cid, now() - make_interval(days => d) - interval '5 hours', food_wet, 'Tuna Pouch', 1, 'pouch', 4, uid);
      if (hashtext(spec.name || d || 'l') % 3) = 0 then
        insert into litter_logs (household_id, cat_id, logged_at, action, stool, urine, created_by)
        values (hid, cid, now() - make_interval(days => d) - interval '12 hours', 'scooped', 'normal', 'normal', uid);
      end if;
    end loop;

    -- grooming every 5 days, play every 2 days
    for d in 0 .. 4 loop
      insert into grooming_logs (household_id, cat_id, logged_at, type, duration_min, created_by)
      values (hid, cid, now() - make_interval(days => d * 5) - interval '20 hours', 'brush', 10, uid);
    end loop;
    for d in 0 .. 9 loop
      insert into activity_logs (household_id, cat_id, logged_at, activity, duration_min, created_by)
      values (hid, cid, now() - make_interval(days => d * 2) - interval '19 hours', 'play', 15, uid);
    end loop;

    -- vaccination history
    insert into vaccination_records (household_id, cat_id, vaccine_name, given_on, next_due_on, clinic, created_by)
    values (hid, cid, 'F3 (FVRCP)', current_date - 300 + (hashtext(spec.name) % 60), current_date + 65 + (hashtext(spec.name) % 60), 'Klinik Hewan Sehat', uid);
    if spec.dob < current_date - 365 then
      insert into vaccination_records (household_id, cat_id, vaccine_name, given_on, next_due_on, clinic, created_by)
      values (hid, cid, 'Rabies', current_date - 200, current_date + 165, 'Klinik Hewan Sehat', uid);
    end if;
    insert into parasite_treatments (household_id, cat_id, kind, product, given_on, next_due_on, created_by)
    values (hid, cid, 'flea_tick', 'Revolution', current_date - 20, current_date + 10, uid);
    insert into parasite_treatments (household_id, cat_id, kind, product, given_on, next_due_on, created_by)
    values (hid, cid, 'deworming', 'Drontal', current_date - 70, current_date + 20, uid);

    insert into journal_entries (household_id, cat_id, logged_at, title, body, created_by)
    values (hid, cid, now() - interval '3 days', 'Sunny spot', spec.name || ' claimed the window seat all afternoon.', uid);
  end loop;

  -- A few story lines so the dashboard has something to show
  -- Luna: repeated sneezing + vet visit + medication
  select id into cid from cats where household_id = hid and name = 'Luna';
  insert into symptom_logs (household_id, cat_id, logged_at, symptom, severity, created_by)
  select hid, cid, now() - make_interval(days => d) - interval '8 hours', 'Sneezing', 'mild', uid from generate_series(1, 4) d;
  insert into vet_visits (household_id, cat_id, visited_on, clinic, vet_name, reason, findings, cost, currency, created_by)
  values (hid, cid, current_date - 2, 'Klinik Hewan Sehat', 'drh. Rina', 'Sneezing for several days', 'Mild upper respiratory signs. Prescribed eye drops and rest. Recheck in 10 days.', 350000, 'IDR', uid);
  insert into cat_medications (household_id, cat_id, name, dose, frequency, times_per_day, start_on, end_on, reason, created_by)
  values (hid, cid, 'Eye drops', '1 drop each eye', 'twice daily', 2, current_date - 2, current_date + 8, 'Vet prescription', uid);
  insert into medication_logs (household_id, cat_id, logged_at, cat_medication_id, medication_name, dose, created_by)
  select hid, cid, now() - make_interval(days => d) - interval '7 hours', m.id, 'Eye drops', '1 drop each eye', uid
  from generate_series(0, 1) d, cat_medications m where m.cat_id = cid;

  -- Oreo: senior, kidney monitoring condition
  select id into cid from cats where household_id = hid and name = 'Oreo';
  insert into cat_conditions (household_id, cat_id, name, noted_on, status, notes, created_by)
  values (hid, cid, 'Early kidney values', current_date - 120, 'monitoring', 'Vet asked for weight checks and renal diet.', uid);
  insert into care_tasks (household_id, cat_id, name, kind, frequency_days, next_due_on, created_by)
  values (hid, cid, 'Renal bloodwork', 'vet_visit', 90, current_date + 12, uid);

  -- Tofu: kitten with deworming schedule, Simba: nail trim overdue
  select id into cid from cats where household_id = hid and name = 'Tofu';
  insert into care_tasks (household_id, cat_id, name, kind, frequency_days, next_due_on, created_by)
  values (hid, cid, 'Kitten deworming', 'deworming', 14, current_date + 3, uid);
  select id into cid from cats where household_id = hid and name = 'Simba';
  insert into care_tasks (household_id, cat_id, name, kind, frequency_days, next_due_on, created_by)
  values (hid, cid, 'Nail trim', 'nail_trim', 21, current_date - 2, uid);

  insert into care_tasks (household_id, cat_id, name, kind, frequency_days, next_due_on, created_by)
  values (hid, null, 'Deep clean litter boxes', 'custom', 7, current_date + 1, uid);
  insert into care_tasks (household_id, cat_id, name, kind, frequency_days, next_due_on, created_by)
  values (hid, null, 'Flea & tick for everyone', 'flea_tick', 30, current_date + 10, uid);

  return hid;
end $$;
revoke execute on function seed_demo_household(text) from public;
grant execute on function seed_demo_household(text) to authenticated;

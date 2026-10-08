-- Deleting a log removes the XP it earned, so add-then-delete cannot farm XP.
-- Streaks, badges and completed quests already reached are kept.

create or replace function revoke_xp_for_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  t xp_transactions;
begin
  delete from xp_transactions where source_table = tg_table_name and source_id = old.id returning * into t;
  if t.id is null or t.xp <= 0 then return old; end if;

  update user_stats
  set total_xp = greatest(total_xp - t.xp, 0), level = level_for_xp(greatest(total_xp - t.xp, 0)), updated_at = now()
  where user_id = t.user_id;
  update household_stats
  set total_xp = greatest(total_xp - t.xp, 0), level = level_for_xp(greatest(total_xp - t.xp, 0)), updated_at = now()
  where household_id = t.household_id;
  if t.cat_id is not null then
    update cat_stats
    set total_xp = greatest(total_xp - t.xp, 0), level = level_for_xp(greatest(total_xp - t.xp, 0)), updated_at = now()
    where cat_id = t.cat_id;
  end if;
  return old;
end $$;
revoke execute on function revoke_xp_for_row() from public;

do $$
declare t text;
begin
  foreach t in array array[
    'weight_logs','feeding_logs','water_logs','litter_logs','symptom_logs','medication_logs',
    'grooming_logs','behavior_logs','activity_logs','journal_entries','photos',
    'vet_visits','vaccination_records','parasite_treatments','care_task_completions'
  ] loop
    execute format('create trigger %I_xp_revoke after delete on %I for each row execute function revoke_xp_for_row()', t, t);
  end loop;
end $$;

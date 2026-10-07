-- 000 Remove the single-owner schema applied before the household model existed.
-- Run once on projects created before migration 001. No-op on a fresh project.

drop trigger if exists on_auth_user_created on auth.users;
drop policy if exists "owner photos" on storage.objects;
delete from storage.objects where bucket_id = 'photos';
delete from storage.buckets where id = 'photos';

drop view if exists owner_stats, growth_velocity, cat_stats cascade;
drop table if exists
  insights, relationship_events, relationships, achievement_unlocks, achievements,
  milestones, quest_completions, quest_templates, photos, health_records, health_logs,
  weight_logs, care_logs, xp_rules, cats, profiles cascade;
drop function if exists apply_care_log_xp(), apply_weight_milestones(), handle_new_user() cascade;
do $$
declare t text;
begin
  for t in select typname from pg_type where typnamespace = 'public'::regnamespace and typtype = 'e' loop
    execute format('drop type if exists %I cascade', t);
  end loop;
end $$;
delete from supabase_migrations.schema_migrations where version = 'init' or name = 'init';

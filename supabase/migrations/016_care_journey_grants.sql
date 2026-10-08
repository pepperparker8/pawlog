-- 016 Tighten 015: fixed search_path on week_start_of, and complete_weekly_quests is trigger-only.

alter function week_start_of(timestamptz) set search_path = public;
revoke execute on function complete_weekly_quests(uuid, uuid, uuid, date) from public, anon, authenticated;

# Database

Postgres on Supabase. All application tables live in `public` and have row level security enabled.

## Migrations

| File | Contents |
| --- | --- |
| `000_reset_legacy.sql` | Removes the original single-owner schema. Only for projects created before `001`. |
| `001_initial_schema.sql` | Enums, households, members, invites, profiles, cats, all log and health tables, care, food, photos, milestones, audit log, triggers |
| `002_rls.sql` | Membership helper functions, RLS policies, tenant consistency trigger, `create_household`, `accept_invite`, Storage bucket and policies |
| `003_gamification.sql` | XP rules, level config, XP ledger, user, household and cat stats, badges, quests, streaks |
| `004_timeline.sql` | `timeline_events`, `cat_summaries`, `weight_weekly` views and the `household_today`, `detect_patterns`, `on_this_day`, `search_household` RPCs |
| `005_notifications.sql` | Notifications, preferences, level-up, badge and member-activity notifications, reminder sweep |
| `006_demo_seed.sql` | `seed_demo_household` RPC |

Migrations are append-only. Changes to an applied migration go in a new numbered file.

## Tenancy

```
households ─┬─ household_members (user_id, role)
            ├─ household_invites
            └─ cats ─┬─ *_logs, health tables, photos, milestones
                     └─ care_tasks ── care_task_completions
```

Every tenant row stores `household_id`. Rows tied to a cat also store `cat_id`, and the `enforce_tenant_consistency` trigger rejects rows whose cat belongs to a different household.

## Tables

| Group | Tables |
| --- | --- |
| Tenancy | `households`, `household_members`, `household_invites`, `profiles` |
| Cats | `cats`, `cat_favorites`, `milestones` |
| Daily logs | `feeding_logs`, `water_logs`, `litter_logs`, `weight_logs`, `symptom_logs`, `medication_logs`, `behavior_logs`, `grooming_logs`, `activity_logs`, `journal_entries` |
| Health | `cat_medications`, `cat_conditions`, `vet_visits`, `vaccination_records`, `parasite_treatments` |
| Care and food | `care_tasks`, `care_task_completions`, `food_profiles`, `feeding_plans` |
| Media | `photos` |
| Gamification | `xp_rules`, `level_config`, `xp_transactions`, `user_stats`, `household_stats`, `cat_stats`, `badges`, `user_badges`, `quest_templates`, `quest_completions` |
| Notifications | `notifications`, `notification_preferences` |
| Audit | `audit_logs` |

Common columns: `id uuid`, `household_id`, `cat_id` where relevant, `created_by`, `created_at`, `updated_at`, `client_event_id` on loggable rows, and `archived_at` or `deleted_at` for soft removal.

## Views

| View | Purpose |
| --- | --- |
| `timeline_events` | Union of every loggable table into one event stream for the timeline |
| `cat_summaries` | One row per cat with latest weight, last fed, counts and profile photo |
| `weight_weekly` | Weekly average weight per cat for long-range charts |

Views use `security_invoker` so RLS of the underlying tables applies.

## RPC functions

| Function | Purpose |
| --- | --- |
| `create_household(name)` | Creates a household and makes the caller owner |
| `accept_invite(token)` | Joins the household of a valid, unexpired invite |
| `seed_demo_household()` | Creates a demo household with cats and history for the caller |
| `household_today(household_id)` | Today counters for the dashboard |
| `quest_progress(household_id)` | Daily and weekly quest progress |
| `detect_patterns(household_id)` | Deterministic attention items |
| `on_this_day(household_id)` | Photos and journal entries from the same date in earlier years |
| `search_household(household_id, q)` | Search over cats, logs, journal and health records |

## Storage

Bucket `cat-photos`, private, image types only. Object path:

```
household/{household_id}/cats/{cat_id}/photos/{photo_id}
```

Storage policies parse the household id from the path and check membership. The client reads images through signed URLs.

## Type generation

```bash
npm run types
```

This writes `src/lib/database.types.ts`. Regenerate after every migration.

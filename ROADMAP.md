# Roadmap

## Phase 1: Foundation (done)

- Household multi-tenant schema with RLS, invites and roles
- Auth, household switcher, app shell, PWA
- Cats, Quick Log, unified timeline
- Health records, growth chart, photos, passport view
- Gamification: XP ledger, levels, badges, quests, streaks
- Care scheduler, food profiles, notifications, realtime, search, vet summary
- Offline log queue, demo seed, unit tests, RLS test script

## Phase 2: Hardening

- Apply migrations to production and resolve all security advisor findings
- Run the RLS test script in CI against a disposable database
- Component and end-to-end tests for login, Quick Log and invites
- Error tracking and basic analytics without personal data

## Phase 3: Passport and sharing

- Passport and vet summary export to PDF
- Time-limited read-only share links for a vet
- Document attachments on vet visits and vaccinations

## Phase 4: Reminders

- Web push for care tasks, medication and vaccination due dates
- Per-member reminder preferences and quiet hours
- Scheduled reminder sweep through a Supabase cron job

## Phase 5: Memory

- Yearly recap per cat
- Album views and photo captions in the timeline
- Family-friendly feed of household activity

## Later

- Native wrapper for iOS and Android
- Smart scale and feeder integrations
- Localization, starting with Indonesian

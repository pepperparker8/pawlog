# PawLog

Multi-cat health, care and memory platform. Households share cats, log daily care in a few taps, keep a medical passport per cat, and earn XP for consistent care.

PawLog records observations. It does not diagnose, score health, or replace a veterinarian.

## Features

- Households with owner, caregiver and viewer roles, invites by link, multiple households per user
- Multi-cat dashboard with attention center, today counters, daily quests and "on this day" memories
- Quick Log bottom sheet: feeding, water, litter, weight, symptoms, medication, behavior, grooming, play, journal; log for one cat or everyone at once
- Cat profile with timeline, health records, growth chart, photos and a printable passport
- Unified timeline with filters and pagination
- Health records: medications, conditions, vet visits, vaccinations, parasite treatments
- Care scheduler with recurring tasks and assignees
- Food profiles, photo library in private Storage, global search, vet summary
- Gamification: XP ledger, levels, badges, quests, forgiving streaks with freezes
- Notifications, realtime refresh, PWA install and an offline log queue

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4, TanStack Query, React Router, Recharts, Supabase (Auth, Postgres, Storage, Realtime), vite-plugin-pwa, Vitest.

## Getting started

Requirements: Node 20 or newer and a Supabase project.

```bash
npm install
```

```bash
cp .env.example .env
```

Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase Project Settings, API. Only the anon or publishable key belongs in the frontend.

Apply the migrations in `supabase/migrations` in order (`001` to `009`). On a project that still has the original single-owner schema, run `000_reset_legacy.sql` first.

```bash
npm run dev
```

Sign-in is passwordless: PawLog emails a link and a code, and a new email gets an account. In Supabase Authentication:

- Email Templates: add `{{ .Token }}` to the "Magic Link" and "Confirm signup" templates so the email shows the code.
- URL Configuration: set Site URL to the deployed app and add `http://localhost:5173/**` and the deployed URL with `/**` to Redirect URLs.

After signing in, choose "Load demo household" on the home screen to seed a household with sample cats and history.

## Deploy

`.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push to `main`. Set the repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and set Pages source to GitHub Actions.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Type check and production build |
| `npm run test` | Unit tests |
| `npm run lint` | oxlint |
| `npm run types` | Regenerate `src/lib/database.types.ts` from Supabase |

Database security tests live in `supabase/tests/rls.sql` and run with psql against a development database.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATABASE.md](DATABASE.md)
- [SECURITY.md](SECURITY.md)
- [GAMIFICATION.md](GAMIFICATION.md)
- [ROADMAP.md](ROADMAP.md)

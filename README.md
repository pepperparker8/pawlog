# PawLog

Raise your cat. A personal cat-care tracker that turns preventive care into a game.

Every cat gets a profile card like an RPG character. The owner earns XP for doing the care, not for the cat being "healthy". Over months, the app becomes a digital life story for each cat.

```
Milo                          Gipi
Lv. 8 — British Shorthair     Lv. 6 — Minuet × BSH
3.5 kg                        1.24 kg
Growth: 87%                   Growth: 76%
Wellness: 94                  Wellness: 81
Mood: Playful                 Mood: Shy
Care Streak: 12 days          Care Streak: 8 days
```

Wellness is a care/engagement score, never a medical diagnosis.

## Core ideas

1. **XP from caring, not from health.** Weigh, scoop, groom, medicate, vaccinate, log food and litter, play, photograph the coat. Each action gives XP. See [docs/xp-and-levels.md](docs/xp-and-levels.md).
2. **Growth Journey.** Weight chart with automatic milestones (2 kg Club, 3 kg Club) and sentences like "Milo gained 1.17 kg over the last 58 days."
3. **Daily Quest.** 3 to 5 small tasks each morning. Completing them extends the Care Streak. A weekly summary reports care completion.
4. **Pet personality.** Traits per cat ("The Chill One", "The Shy One"), learned from logged data over time.
5. **Health Timeline.** Month-by-month story view instead of a flat medical record.
6. **Health Passport.** One page per cat with vaccinations, deworming, parasite control, medication, allergies, vet visits, sterilization, blood tests, dental, microchip. Export as a 1 to 2 page vet PDF.
7. **Care Streak, three tiers.** Daily streak, weekly completion %, lifetime Care XP. Achievements on top. Not Duolingo-aggressive.
8. **Relationship between cats.** Milo × Gipi score and a socialization timeline.
9. **Owner Care Level.** XP from consistency unlocks owner titles.
10. **AI insight.** "Something changed" notes from the data: weight velocity, appetite below 30-day average, weight flat despite normal intake. Never a diagnosis.
11. **On This Day.** Each app open shows what each cat looked like weeks or months ago.

Full concept: [docs/concept.md](docs/concept.md).

## App structure

```
Home        Milo ❤️ Gipi, On This Day, Today's Quest
Today       Feeding, Water, Litter, Play, Grooming
Health      Weight, Appetite, Stool, Urine, Symptoms
Growth      Weight chart, Milestones, Body condition
Care        Vaccines, Deworming, Parasite, Medication, Grooming
Journal     Photos, Notes, Timeline
Insights    Trends, Anomalies, AI summary
Achievements XP, Streak, Badges
```

## Repository layout

```
prototype/      Static HTML click-through prototype (open index.html in a browser)
docs/           Concept, XP rules, data model, roadmap
supabase/       Supabase config and SQL migrations (schema + row-level security)
```

## Status

Concept and prototype stage. No application code yet. The data model is defined in [supabase/migrations](supabase/migrations) and explained in [docs/data-model.md](docs/data-model.md).

## Planned stack

- Supabase: Auth, Postgres, Storage (photos), row-level security per owner
- Frontend: to be decided (mobile-first web/PWA or Expo)
- PDF export for the vet report generated server-side

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).

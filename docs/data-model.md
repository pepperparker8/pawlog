# Data model

Postgres on Supabase. Every table that holds owner data carries `owner_id` and row-level security so a user only sees their own cats. Schema source of truth: [supabase/migrations](../supabase/migrations).

## Entities

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user. Owner XP and level. |
| `cats` | Cat identity: name, title ("The Chill One"), breed, sex, DOB, adoption date, microchip, sterilization, target adult weight, traits, avatar. |
| `xp_rules` | Activity → XP and daily cap. Seeded, editable. |
| `care_logs` | Every care action: feed, water, litter, play, grooming, weigh, medication, vaccine, vet visit, poop, pee, photo. Carries XP earned and a `meta` JSON for details. |
| `weight_logs` | Weight in kg with optional body condition score. The source for Growth Journey. |
| `health_logs` | Daily observations: appetite, stool, urine, symptoms, mood, note. |
| `health_records` | Passport items with due dates: vaccination, deworming, parasite control, medication, vet visit, blood test, dental, sterilization, allergy. |
| `photos` | Storage path, caption, tag, taken_at. |
| `quest_templates` | Daily quest definitions per owner (or per cat). |
| `quest_completions` | Which quest was done on which day. |
| `milestones` | Unlocked weight clubs and other growth milestones. |
| `achievements` | Badge catalog. |
| `achievement_unlocks` | Badge unlocked for a cat or an owner. |
| `relationships` | Pair of cats with current score and status. |
| `relationship_events` | Chasing, hiding, eating together, sleeping near, playing, allogrooming, conflict. |
| `insights` | Generated "something changed" notes with severity and the data window they came from. |

## Derived data (views)

| View | Purpose |
|---|---|
| `cat_stats` | Current weight, care XP, level, last weighed, last photo. Feeds the profile card. |
| `growth_velocity` | Gain in kg over the last 30 and 58 days per cat. |
| `care_streaks` | Daily streak and 7-day completion per owner. |
| `on_this_day` | Logs from the same calendar day in previous months. |

## Storage

Bucket `photos`, private, path `{owner_id}/{cat_id}/{uuid}.jpg`. Access through signed URLs.

## Not stored

No medical diagnosis fields. Free-text notes only. Insights are suggestions and are labeled as such in the UI.

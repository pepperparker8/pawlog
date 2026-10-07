# PawLog roadmap

Principle: good care leads to progress; more data does not. PawLog records and organises care. It does not diagnose.

## Phase 1: UX foundation (done)
- Cat profile tabs use absolute links (Health, Growth, Photos, Passport load again).
- Profile header: tap the avatar to add or change the photo, cat switcher, quick actions (Feed, Weigh, Litter, Meds, Observe, Photo).
- Overview: today (fed, litter, medication doses), coming up, key stats, recent events.
- Log sheet: scrolls on phones, sticky save button, current cat preselected, medication chips linked to the active course, XP toast shows the actual award.
- Home: compact cat list sorted by attention (red due, amber follow-up, green on track).
- New cat form takes a profile photo.
- Fixes: parasite kinds, local-day "fed today", stale caches, signed URL cache, unlinked doses causing false "behind schedule" alerts.

## Phase 2: health intelligence
- Breed reference table (typical adult range, sex-specific where published, source, URL, last reviewed). "Breed-specific reference unavailable" when there is none.
- Weight targets with source: vet > owner > breed reference.
- Body condition score with source (vet assessment or owner observation).
- `getWeightStatus(cat)`: Growing, Healthy maintenance, Underweight, Overweight, Unknown, computed on read with confidence, range, reason and source.
- Growth chart with reference and target bands. Factual insight cards. Short sourced Learn articles.

## Phase 3: gamification
- XP per meaningful action with diminishing returns; feeding no longer farmable.
- Contextual milestones replace "N kg Club". No reward for gain when a cat is overweight.
- Care-journey level titles. Meaningful badges replace count badges.
- Weekly per-cat care quests and a weekly Care Rhythm instead of daily streak pressure.

## Phase 4: practical tools
- Reminders, photo memories, search, vet visit summary.

## Phase 5: polish
- Empty and error states, accessibility pass, small celebration animations, performance.

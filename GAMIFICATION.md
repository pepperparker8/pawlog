# Gamification

XP rewards the person doing the care. It never rates the cat's health.

## Principles

- The database is the single source of truth. Triggers award XP when a loggable row is inserted.
- Every award is keyed by `client_event_id`, so retries and offline replays are idempotent.
- Rules, levels, badges and quests are rows in config tables, not code.
- Anti-spam: each rule has a repeat window and a daily cap per user.
- Streaks forgive missed days through streak freezes.

## XP rules

Table `xp_rules`.

| Event | XP | Window (min) | Daily cap |
| --- | --- | --- | --- |
| Weigh in | 10 | 720 | 20 |
| Feed | 5 | 60 | 30 |
| Fresh water | 3 | 120 | 12 |
| Litter care | 5 | 120 | 20 |
| Give medication | 20 | 60 | 60 |
| Vaccination | 50 | none | none |
| Vet visit | 50 | none | none |
| Parasite treatment | 30 | none | none |
| Grooming | 10 | 180 | 30 |
| Play session | 10 | 60 | 30 |
| Observation | 5 | 30 | 15 |
| Behavior note | 5 | 30 | 15 |
| Memory photo | 5 | 10 | 25 |
| Journal entry | 5 | 30 | 15 |
| Care task done | 15 | none | 60 |

A repeat inside the window for the same cat and event is logged but earns no XP. A window or cap of zero means no limit.

## Levels

Table `level_config`.

| Level | Min XP | Title |
| --- | --- | --- |
| 1 | 0 | New Pawrent |
| 2 | 100 | Kitten Sitter |
| 3 | 250 | Litter Keeper |
| 4 | 500 | Cat Caretaker |
| 5 | 1000 | Whisker Watcher |
| 6 | 1750 | Nap Guardian |
| 7 | 2750 | Treat Sommelier |
| 8 | 4000 | Purr Engineer |
| 9 | 5500 | Cat Whisperer |
| 10 | 7500 | Pawrent Pro |
| 12 | 11000 | Clowder Captain |
| 15 | 17500 | Grand Pawrent |
| 20 | 30000 | Legendary Cat Dad |

## Ledger and stats

- `xp_transactions` records every award with user, household, cat, event type, source row and `client_event_id`.
- Triggers on the ledger update `user_stats`, `household_stats` and `cat_stats`, then check badges and quests.
- Level-ups and new badges create notifications.

## Streaks

A care day is any day, in the household time zone, with at least one XP-earning action. Consecutive days extend the streak. A missed day consumes a streak freeze instead of resetting the streak, and freezes refill over time. Households keep their own streak for shared activity.

## Badges

Table `badges`, with scope user, household or cat. Criteria are JSON evaluated by `check_badges`.

| Kind | Example |
| --- | --- |
| Count of an event | Scale Friend: ten weigh-ins |
| Streak | Week Warrior: seven-day streak |
| Level | Pawrent Pro: level 10 |
| Number of cats | Clowder Keeper: three cats |
| Days logged for a cat | Anniversary: one year of care |

## Quests

Table `quest_templates`. Quests are daily or weekly, tracked by `quest_progress`, and completed automatically by a ledger trigger.

| Quest | Target | Reward |
| --- | --- | --- |
| Breakfast is served | A meal for every cat | 20 XP |
| Fresh box | Clean the litter box | 10 XP |
| Fresh water | Refresh the water bowl | 10 XP |
| Play time | One play session | 15 XP |
| Weekly weigh-in | Weigh every cat | 30 XP |
| Brush day | Groom one cat | 20 XP |
| Capture a moment | Save one photo | 10 XP |

## Changing the economy

Edit rows in the config tables through a new migration. Existing ledger rows keep the XP they were awarded.

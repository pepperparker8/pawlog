# XP, levels, streaks, achievements

## Care XP per activity

| Activity | XP |
|---|---|
| Weigh the cat | 10 |
| Clean litter | 5 |
| Grooming | 10 |
| Give medication on schedule | 20 |
| Vaccination | 50 |
| Vet check-up | 50 |
| Log a meal | 5 |
| Log poop/pee | 3 |
| 15 min playtime | 10 |
| Coat condition photo | 5 |

XP is awarded to the cat (cat level) and to the owner (owner level). Values live in the `xp_rules` table so they can be tuned without a release.

Anti-grind: the same activity for the same cat gives XP at most N times per day (`daily_cap` in `xp_rules`).

## Cat level

Level = floor(sqrt(care_xp / 100)). 100 XP for level 1, 400 for level 2, 900 for level 3, and so on.

## Owner level

Same curve over the owner's total XP. Titles:

| Level | Title |
|---|---|
| 1 | Cat Caretaker |
| 5 | Basic Caretaker |
| 10 | Responsible Cat Parent |
| 20 | Cat Wellness Nerd |
| 30 | Feline Care Master |

## Streaks

| Tier | Definition |
|---|---|
| Daily Care Streak | Consecutive days where all daily quests for all cats were completed. One grace day per 7-day window. |
| Weekly Care Completion | Completed quests ÷ planned quests over the last 7 days. |
| Lifetime Care XP | Sum of all XP ever earned. |

## Wellness score (0 to 100)

A care score, not a medical one.

- 40 pts: quests completed over the last 7 days (completion %)
- 20 pts: weight logged in the last 14 days
- 20 pts: routine care not overdue (vaccines, deworming, parasite control)
- 10 pts: any photo or note in the last 7 days
- 10 pts: active streak ≥ 3 days

## Growth milestones

Automatic when a weight log crosses a threshold for the first time: 1 kg, 2 kg, 3 kg, 4 kg, 5 kg Club. Kitten weight targets are owner-editable per cat.

## Achievements

| Badge | Condition |
|---|---|
| First Steps | 10 care logs |
| First Vaccine | first vaccination record |
| Weight Tracker | 5 weight logs |
| Growth Tracker | 3 weight logs within 30 days |
| Grooming Pro | 10 grooming logs |
| Grooming Master | 50 grooming logs |
| Photo Chronicler | 30 photo logs |
| Vaccine Keeper | no overdue vaccine for 90 days |
| Preventive Care Pro | vaccine, deworming and parasite control all on schedule for 180 days |
| 10 Vet Visits | 10 vet visit records |
| 1 Year Together | 365 days since adoption date |
| 100-Day Care Streak | daily streak reaches 100 |

Achievement definitions live in the `achievements` table, unlocks in `achievement_unlocks`.

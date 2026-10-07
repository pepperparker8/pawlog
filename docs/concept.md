# Concept: Raise Your Cat

PawLog treats each cat like an RPG character and the owner like the player. Progress comes from preventive care that the owner actually does. Nothing in the app is a diagnosis.

## 1. Profile card

```
Milo
Lv. 8 — British Shorthair
3.5 kg
Growth: 87%
Wellness: 94
Mood: Playful
Care Streak: 12 days
```

- **Level** comes from the cat's accumulated Care XP.
- **Growth %** compares current weight against the expected adult weight for breed and sex (owner-editable target).
- **Wellness** is a care score: recency and completeness of logs, routine care on schedule, streak. Never medical.
- **Mood** is the latest mood tag the owner logged.

## 2. XP from caring, not from "healthy"

The owner gets points for performing care, so a sick cat never lowers the score and a healthy cat never inflates it. XP table in [xp-and-levels.md](xp-and-levels.md).

## 3. Growth Journey

Weight history, e.g. 1.6 → 1.7 → 1.95 → 2.33 → 3.5 kg, rendered as a chart plus automatic milestones:

```
🏆 2 kg Club   Milo reached 2.0 kg
🏆 3 kg Club   Milo reached 3.0 kg
```

For kittens the trajectory view shows weight, age, body condition, growth velocity and feeding pattern, with plain sentences:

> Milo gained 1.17 kg over the last 58 days.

## 4. Daily Quest

Each morning 3 to 5 small quests:

```
TODAY'S QUEST
☐ Feed Milo
☐ Feed Gipi
☐ Scoop litter
☐ Check water
☐ 10 min playtime
```

Completing the set extends the Care Streak. Weekly summary:

> You cared for Milo & Gipi on 96% of planned days this week.

## 5. Pet-specific personality

Not "Cat #001" but:

```
Milo — The Chill One
Calm · Affectionate · Food motivated · Petting-sensitive · Low vocalization

Gipi — The Shy One
Timid · High-pitched vocal · Food-sensitive · Socially cautious
```

Traits start as owner-chosen tags, then the app proposes trait observations from data:

> Gipi tends to hide more on days with less interaction.
> Milo appears to vocalize less than Gipi.

## 6. Health Timeline

A story-style timeline instead of a table:

```
Milo — 2026 Journey
June     🐾 Adopted · ⚖️ 1.60 kg · 💉 F3
July     ⚖️ 1.95 kg · 🧼 Grooming · 🦟 Flea treatment
August   ⚖️ 2.33 kg · 💉 F4
October  ⚖️ 3.5 kg · ✂️ Grooming
```

## 7. Health Passport

One page per cat: DOB, breed, sex, weight history, vaccinations, deworming, flea/tick treatment, medication, allergies, vet visits, sterilization, blood tests, dental, microchip.

Button: **Export Vet Report** → 1 to 2 page PDF to bring to the clinic. This is the feature with the most real-world utility.

## 8. Care Streak, three tiers

```
Daily     Care Streak: 14 days
Weekly    92% Care Completion
Lifetime  4,820 Care XP
```

Achievements: First Vaccine, 10 Vet Visits, 1 Year Together, Grooming Master, Weight Tracker, Preventive Care Pro.

Streak logic is forgiving: one missed day does not reset a long streak immediately (grace day), to avoid Duolingo fatigue.

## 9. Relationship between cats

```
Milo × Gipi
Relationship: 64/100
Status: Getting Comfortable
```

Tracked events: chasing, hiding, eating together, sleeping near each other, playing, grooming each other, conflict. Positive events raise the score, conflict lowers it, with time decay.

Timeline:

```
Week 1   Gipi frequently hides
Week 3   Supervised interaction increased
Week 5   Shared room
Week 8   Play interaction detected
```

## 10. Owner Care Level

```
YOU ARE LEVEL 17 — CAT CARETAKER
```

Levels: 5 Basic Caretaker, 10 Responsible Cat Parent, 20 Cat Wellness Nerd, 30 Feline Care Master.

## 11. AI insight

The biggest differentiator from a spreadsheet. The app only says "something changed":

> **Milo Insight.** Weight increased 18% over the last 30 days. Feeding frequency remained stable, but wet-food intake increased.

> **Gipi Insight.** Appetite has been below his 30-day average for 2 consecutive days.

> **Potential anomaly.** Gipi's weight has remained unchanged for 10 days despite normal reported food intake.

Rule-based detectors first (velocity, rolling averages, missing logs), an LLM summary on top later.

## 12. On This Day

Every app open:

```
Milo — 4 months ago        Gipi — 2 months ago
1.95 kg                    1.24 kg
First grooming             First interaction with Milo
F3 vaccinated
```

## Navigation

```
HOME          Milo ❤️ Gipi · On This Day · Today's Quest
Today's Care  Feeding · Water · Litter · Play · Grooming
Health        Weight · Appetite · Stool · Urine · Symptoms
Growth        Weight chart · Milestones · Body condition
Care          Vaccines · Deworming · Parasite · Medication · Grooming
Journal       Photos · Notes · Timeline
Insights      Trends · Anomalies · AI summary
Achievements  XP · Streak · Badges
```

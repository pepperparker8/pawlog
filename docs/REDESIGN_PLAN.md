# PawLog redesign: from ledger to companion

Status: Phase 6 done. Phase 7 built; Ask answers once `ANTHROPIC_API_KEY` is set.

## 1. Problem

PawLog today is a set of forms: 20 record types, a quick-log sheet, XP, streaks and quests. Every insight depends on the owner filling in a form, and the app gives little back besides lists and charts. Two things are missing:

- A way to ask a question about a specific cat and get an answer grounded in that cat's records.
- A reason to open the app that is not "log something".

## 2. What the research says

### 2.1 Competitor teardown (public sources only)

| App | What it does | Borrow | Avoid |
|---|---|---|---|
| PetNoter | Manual logs, documents stored as files. "PetNoter AI" answers questions using breed, age, weight history, vaccines, meds, notes and photos. Every answer opens with one of five urgency levels. One-tap vet summary with questions to ask. Consent before first use, chats deleted after 30 days. | Grounded Q&A, visible context card, fixed urgency header, vet summary, consent and retention | Logging is still fully manual; AI added on top of unchanged forms |
| 11pets | Manual forms and reminders, behaviour trait ratings, range warnings, vet entry without an account, community challenges. No AI found. 3.3 stars, complaints about data loss, navigation, multi-pet paywall. | Range warnings against the cat's own values | Module sprawl, challenges and points, paywalling multi-pet |
| Petcube | Guided health-check baseline, then AI, then a vet chat that receives the same context. | Guided baseline instead of blank forms; handoff with context | Generic answers (one review) |
| Sylvester.ai | Face photo, comfort check based on feline pain scales, "not a diagnosis". | Short, guided check-ins | A photo-derived score (developer accuracy claims only, see 2.2) |
| Whisker | Litter box records weight and visits passively, flags deviations from the cat's own baseline. | Trend against own baseline | Needs hardware |

No app found drafts log entries from a conversation. That gap is where "less logging" comes from.

Binary analysis was not run: the REA server did not connect. Store listings, product sites and reviews only. An APK or IPA can be analysed if supplied.

### 2.2 Wellbeing methods

| Method | Evidence | How PawLog uses it | What PawLog must not do |
|---|---|---|---|
| Five Domains (Mellor et al., 2020); AAFP/ISFM environmental needs, five pillars (Ellis et al., 2013) | Framework; expert consensus | Weekly environment check, one tap per pillar | Score the household |
| Changes in routine and sickness behaviour (Stella et al., 2011) | Unusual events raised sickness behaviours 3.2-fold; top signs vomiting, toileting outside the box, eating less | Daily 4-tap check-in, household-change tag, alerts on change from the cat's own pattern | Suggest a cause |
| CHEW (Freeman et al., 2016); CatQoL (Bijsmans et al., 2016); VetMetrica domains: vitality, comfort, emotional wellbeing (Noble et al., 2019) | Moderate to high, mostly in healthy or CKD cats | Weekly check-in with 7-day recall, shown per domain as a trend | Combine into one number; reuse licensed item wording or claim validation |
| 9-point BCS (Laflamme, 1997); owners underestimate BCS (Blanchard et al., 2023) | High for vets, weak for owners | Monthly weight plus a guided rib, waist and belly check that ends in "talk to your vet about weight" | Label a cat overweight |
| CSOM (Lascelles et al., 2007); FMPI (Benito et al., 2013; Gruen et al., 2015); MI-CAT(C) (Klinck et al., 2018) | Low to moderate; owner placebo effect | Monthly "3 things you've noticed" with better, same or worse | Present a mobility score |
| Feline Grimace Scale (Evangelista et al., 2019; Evangelista & Steagall, 2021) | High for vets; owners agree with vets on still images | Optional face check with reference pictures; several features flagged leads to "contact your vet" | Show 0 to 10 or a cut-off |
| Automated pain detection from photos (Feighelstein et al., 2022; Steagall et al., 2023) | Lab image sets only | Not built | Any photo-to-pain output |
| Life stage and senior guidelines (Quimby et al., 2021; Ray et al., 2021) | Consensus guidelines | Checkup reminders by life stage: yearly, every 6 months for seniors | |
| DIAQoL-pet (Niessen et al., 2010) | Most high-impact items concern the owner | Optional caregiver check during long treatments | |
| AI answers to owners (Griot & Ward, 2026; Abani et al., 2023; BVA, 2026) | Owners prefer chatbot answers without accuracy being checked; answers shift with wording | Urgency header, vet framing, refuse diagnosis, show what records were used | Confident, polished answers to symptom questions |

Two constraints follow from the literature and match existing house rules: owner reports are inputs for the vet, not measurements, and anything that produces a total looks like a health score.

## 3. Principles

1. Ask, don't fill. Home opens with each cat and an "Ask about {name}" box.
2. Baseline, not score. Observations per domain, compared with the cat's own recent pattern. No totals.
3. Point to the vet, never diagnose.
4. Capture once. Text, photos and vet PDFs become draft entries that the owner confirms.
5. Calm by default. XP, streaks and quests are off unless switched on.

## 4. Features

### 4.1 Daily check-in (replaces most quick logs)

One card per cat, about 10 seconds:

- Eating: usual / less / not eating
- Litter: usual / changed
- Vomiting: no / yes
- Energy: usual / low
- Optional tags: visitors, travel, new pet, vet visit, routine change
- Optional note

Feeding plans and medication schedules mark meals and doses "as planned" with one tap; changes are edited, not re-entered. Weight stays a separate log.

Alerts are deterministic rules in `attention.ts`, not AI: for example "less eating" on 3 days in a row, or any "not eating", leads to "Your vet would want to know about this." No cause is shown.

### 4.2 Weekly and monthly check-ins

- Weekly, about 6 taps: vitality, comfort, mood (7-day recall, better / same / worse), plus the five environment pillars.
- Monthly: weight reminder, guided body check, three owner-chosen mobility items, optional face check.
- Results appear as per-domain trends on the cat page. No combined number anywhere.

### 4.3 Ask PawLog

Flow: the owner types a question in the cat's Ask box. A context card shows what will be used: profile, life stage, last 30 days of check-ins, weights, active conditions and medications, recent vet visits. The answer streams back in a fixed shape:

1. Urgency: No urgent concern / Monitor at home / Book a vet visit / See a vet today / Emergency
2. Answer
3. What to watch
4. Questions for your vet

Architecture:

- Supabase Edge Function `ask` (Deno, `@anthropic-ai/sdk`). The Anthropic key lives only in an edge-function secret that the owner sets; the frontend keeps only the anon key.
- The function forwards the caller's JWT, so every record lookup runs under RLS. The service role key is not used.
- Read-only tools (`strict: true`): `get_checkins`, `get_weights`, `get_vet_visits`, `get_medications`. Record text goes in as data, never as instructions.
- System prompt plus cat context sent as a stable, cached prefix (prompt caching).
- Structured output for the urgency level and sections. A `refusal` stop reason renders as "Ask your vet about this one".
- Deterministic red-flag check before the model call (for example: open-mouth breathing, straining with no urine, collapse, not eating for 24 hours). A match shows the Emergency header regardless of the model's answer.

Access and data:

- Owners and caregivers can ask; viewers can read existing threads only.
- Switched on per household in More.
- `ask_threads` and `ask_messages` with household RLS, soft delete and `client_event_id`.
- Messages older than 30 days are purged lazily on the next call. No pg_cron.
- Per-user daily question cap enforced in the function.

Model choice (per question: about 6k input tokens mostly cached, about 600 output tokens; prices per million tokens input / output):

| Model | Price | Rough cost per question | 10 questions a day |
|---|---|---|---|
| Opus 5.5 `claude-opus-5-5` | $4 / $20 | $0.02 to $0.04 | $6 to $12 a month |
| Sonnet 5.5 `claude-sonnet-5-5` | $2 / $10 | $0.01 to $0.02 | $3 to $6 a month |
| Haiku 5.5 `claude-haiku-5-5` | $0.10 / $0.50 | under $0.002 | under $0.50 a month |

Haiku 5.5 is the default. The model is an edge-function setting, so it can change without a release. Estimates to be checked against `usage` after the first week.

### 4.4 Capture without forms

- Free text in Ask or the check-in note ("ate half a pouch, vomited once") becomes draft rows through a `propose_entries` tool. Nothing is saved until the owner confirms.
- Vet report photo or PDF becomes a draft vet visit with findings, lab values and follow-up date, using document and image input.
- Weekly story per cat, written when the owner opens the app that week, stored once per week. It summarises records and changes and points to the vet when alerts fired.

### 4.5 Condition support

Generic treatment course on any active condition: start date, planned length, day N of M, doses given, weight trend against start, next reassessment. Works for any long course (for example an antiviral course, CKD diet, post-surgery recovery) without condition-specific code.

### 4.6 Home and navigation

- Home: one card per cat with status line from data (treatment day, next due item, last weight change), today's check-in chips, Ask box.
- Timeline becomes Story: check-ins, Ask threads, vet visits and weekly stories in one feed.
- Grooming, activity and behaviour logs fold into check-in tags and notes; old records stay readable.
- XP moves to a settings switch, off by default. Tables and history stay.

## 5. Phases

| Phase | Scope | Migrations | Size |
|---|---|---|---|
| 6 (done) | Daily check-in, baseline alerts, home cards, XP switch, one-tap doses | 020 `daily_checkins` | 1 to 2 sessions |
| 7 (built) | Ask PawLog v1: edge function, owner switch, urgency header, red-flag check, cap, lazy purge. One thread per cat, context sent with each question instead of tools. | 021 `ask_messages`, household `ai_enabled` | 2 sessions |
| 8 (built) | Lab results from photo or PDF: crop, Sonnet 5.5 draft, confirm, printed-range status, trend, questions for the vet | 022 `lab_reads`, `lab_reports`, `lab_results` | 1 session |
| 8b (built) | Exception-only logging: no daily prompts, doses assumed given unless marked missed, Off day sheet with any past day. Trends tab: weight chart with off-day bands, calendar, sourced insights, treatment courses with day count and review date | 023 exception logging, 024 `treatment_courses` | 1 session |
| 8c (built) | Course report for the vet review: dose adherence, weights, off days and labs within the course window, printable. Seven-day summary on Home. Photos by age: age or date entry, EXIF date, age sections, profile photo from the lightbox | none | 1 session |
| 9 | Capture from text into drafts; weekly story | 025 `weekly_stories`, draft status on log tables | 2 sessions |
| 10 | Weekly and monthly check-ins, life-stage reminders, vet summary with questions to ask | 026 `wellbeing_checks` | 2 sessions |

Each phase ships on its own and keeps existing data and tests.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Owners trust a fluent answer too much | Urgency header, deterministic red flags, no diagnosis, context card, "questions for your vet" |
| Health records sent to a third-party API | Owner opt-in per household, only the selected cat's last 30 days, 30-day retention, documented in SECURITY.md |
| Prompt injection through stored notes | Records passed as data, read-only tools, drafts need confirmation |
| Cost runaway | Daily cap, cached prefix, model setting |
| Check-ins mistaken for validated instruments | Own wording, no instrument names or totals in the UI |
| Owner bias in reports | Trends and vet framing, not judgements |

## 7. Decisions

1. Model: Haiku 5.5 for Ask, Sonnet 5.5 for lab papers.
2. Who can ask: owners and caregivers.
3. Ask history: 30 days.
4. XP: off by default, switch in More.
5. Phase order: 6 then 7.

PawLog is a personal app for one household, so the consent flow and multi-user cost controls stay minimal.

## References

### Products

- PetNoter. https://petnoter.com; App Store https://apps.apple.com/app/id1580581463
- 11pets. https://www.11pets.com

### Literature (APA 7)

- Abani, S., De Decker, S., Tipold, A., Nessler, J. N., & Volk, H. A. (2023). Can ChatGPT diagnose my collapsing dog? *Frontiers in Veterinary Science, 10*, 1245168. https://doi.org/10.3389/fvets.2023.1245168
- Benito, J., et al. (2013). Reliability and discriminatory testing of a client-based metrology instrument, feline musculoskeletal pain index (FMPI) for the evaluation of degenerative joint disease-associated pain in cats. *The Veterinary Journal, 196*(3), 368–373.
- Benito, J., et al. (2013). Feline musculoskeletal pain index: Responsiveness and testing of criterion validity. *Journal of Veterinary Internal Medicine, 27*(3), 474–482. https://doi.org/10.1111/jvim.12077
- Bijsmans, E. S., Jepson, R. E., Syme, H. M., Elliott, J., & Niessen, S. J. M. (2016). Psychometric validation of a general health quality of life tool for cats used to compare healthy cats and cats with chronic kidney disease. *Journal of Veterinary Internal Medicine, 30*(1), 183–191. https://doi.org/10.1111/jvim.13656
- Blanchard, T., Hoummady, S., Banuls, D., Roche, M., Bynens, A., Meunier, M., Dos Santos, N., Tissaoui, E., Rouch-Buck, P., Fantinati, M., & Priymenko, N. (2023). The perception of the body condition of cats and dogs by French pet owners and the factors influencing underestimation. *Animals, 13*(23), 3646. https://doi.org/10.3390/ani13233646
- British Veterinary Association. (2026, January 7). *BVA calls for open-minded approach to AI use but cautions technology must support, not replace, vet expertise*. https://www.bva.co.uk/news-and-blog/news-article/bva-calls-for-open-minded-approach-to-ai-use-but-cautions-technology-must-support-not-replace-vet-expertise/
- Ellis, S. L. H., Rodan, I., Carney, H. C., et al. (2013). AAFP and ISFM feline environmental needs guidelines. *Journal of Feline Medicine and Surgery, 15*(3), 219–230. https://doi.org/10.1177/1098612X13477537
- Evangelista, M. C., & Steagall, P. V. (2021). Agreement and reliability of the Feline Grimace Scale among cat owners, veterinarians, veterinary students and nurses. *Scientific Reports, 11*, 5262. https://doi.org/10.1038/s41598-021-84696-7
- Evangelista, M. C., et al. (2019). Facial expressions of pain in cats: The development and validation of a Feline Grimace Scale. *Scientific Reports, 9*, 19128. https://doi.org/10.1038/s41598-019-55693-8
- Feighelstein, M., Shimshoni, I., Finka, L. R., Luna, S. P. L., Mills, D. S., & Zamansky, A. (2022). Automated recognition of pain in cats. *Scientific Reports, 12*, 9575. https://doi.org/10.1038/s41598-022-13348-1
- Freeman, L. M., Rodenberg, C., Narayanan, A., Olding, J., Gooding, M. A., & Koochaki, P. E. (2016). Development and initial validation of the Cat HEalth and Wellbeing (CHEW) Questionnaire. *Journal of Feline Medicine and Surgery, 18*(9), 689–701. https://doi.org/10.1177/1098612X16657386
- Griot, A., & Ward, R. (2026). Perceptions of ChatGPT- and veterinarian-generated responses to pet owners' medical questions. *Frontiers in Veterinary Science*. https://doi.org/10.3389/fvets.2026.1939644
- Gruen, M. E., Griffith, E. H., Thomson, A. E., Simpson, W., & Lascelles, B. D. X. (2015). Criterion validation testing of clinical metrology instruments for measuring degenerative joint disease associated mobility impairment in cats. *PLOS ONE, 10*(7), e0131839. https://doi.org/10.1371/journal.pone.0131839
- Klinck, M. P., et al. (2018). Development and preliminary validity and reliability of the Montreal Instrument for Cat Arthritis Testing, for use by caretaker/owner, MI-CAT(C), via a randomised clinical trial. *Applied Animal Behaviour Science, 200*, 96–105. https://doi.org/10.1016/j.applanim.2017.11.013
- Laflamme, D. (1997). Development and validation of a body condition score system for cats: A clinical tool. *Feline Practice, 25*, 13–18.
- Lascelles, B. D. X., Hansen, B. D., Roe, S., et al. (2007). Evaluation of client-specific outcome measures and activity monitoring to measure pain relief in cats with osteoarthritis. *Journal of Veterinary Internal Medicine, 21*(3), 410–416. https://doi.org/10.1111/j.1939-1676.2007.tb02983.x
- Mellor, D. J., Beausoleil, N. J., Littlewood, K. E., et al. (2020). The 2020 Five Domains Model: Including human–animal interactions in assessments of animal welfare. *Animals, 10*(10), 1870. https://doi.org/10.3390/ani10101870
- Niessen, S. J. M., Powney, S., Guitian, J., Niessen, A. P. M., Pion, P. D., Shaw, J. A. M., & Church, D. B. (2010). Evaluation of a quality-of-life tool for cats with diabetes mellitus. *Journal of Veterinary Internal Medicine, 24*(5), 1098–1105. https://doi.org/10.1111/j.1939-1676.2010.0579.x
- Noble, C. E., Wiseman-Orr, L. M., Scott, M. E., Nolan, A. M., & Reid, J. (2019). Development, initial validation and reliability testing of a web-based, generic feline health-related quality-of-life instrument. *Journal of Feline Medicine and Surgery, 21*(2), 84–94. https://doi.org/10.1177/1098612X18758176
- Quimby, J., Gowland, S., Carney, H. C., DePorter, T., Plummer, P., & Westropp, J. (2021). 2021 AAHA/AAFP feline life stage guidelines. *Journal of Feline Medicine and Surgery, 23*(3), 211–233. https://doi.org/10.1177/1098612X21993657
- Ray, M., Carney, H. C., Boynton, B., Quimby, J., Robertson, S., St Denis, K., Tuzio, H., & Wright, B. (2021). 2021 AAFP feline senior care guidelines. *Journal of Feline Medicine and Surgery, 23*(7), 613–638. https://doi.org/10.1177/1098612X211021538
- Stella, J. L., Lord, L. K., & Buffington, C. A. T. (2011). Sickness behaviors in response to unusual external events in healthy cats and cats with feline interstitial cystitis. *Journal of the American Veterinary Medical Association, 238*(1), 67–73. https://doi.org/10.2460/javma.238.1.67
- Steagall, P. V., et al. (2023). Fully automated deep learning models with smartphone applicability for prediction of pain using the Feline Grimace Scale. *Scientific Reports, 13*, 21584. https://doi.org/10.1038/s41598-023-49031-2

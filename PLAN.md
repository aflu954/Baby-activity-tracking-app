# Baby Activity Tracker — Product Plan

## Context

Working parents of babies aged 0–24 months have little time with their child and want that time to count: activities the baby enjoys that also support development. Today a parent has to work out what suits each age, keeps no record of what they did, and can't easily see how the baby is progressing.

The app knows the baby's age in days and gives the parent a **daily checklist of play games** for that age. The parent plays the games, ticks them off, and answers a quick "what did your baby do?" question for each one. Those answers, plus regular growth measurements, are how the app monitors the baby's development over time. Building starts once the design system is provided.

## A constraint the app has to respect

Play activities do not measurably drive weight or length; feeding, sleep and health do. So the app tracks two separate signals and never claims a game caused growth:

- **Developmental milestones**: observed skills, from the CDC "Learn the Signs. Act Early." checklists (2022 revision: 2, 4, 6, 9, 12, 15, 18, 24 months).
- **Physical growth**: weight, length and head circumference against the WHO Child Growth Standards percentiles (the standard for 0–24 months).

Each game is tagged with the area it exercises (motor, language, cognitive, social-emotional) and linked to the milestones it lets the parent observe. Playing is how the parent *sees* development happen; the app records what they saw. If an expected milestone is still unmarked after its age, the app shows a gentle prompt to mention it at the next check-up. It gives no scores and no "behind" labels, and it is not a medical tool.

## MVP features

1. **Baby profile**: name, date of birth, sex (the WHO charts need it), weeks of gestation if born early (for corrected age), optional photo. More than one baby is supported.
2. **Today's game checklist**: header like "Day 142 · 4 months 20 days", then a checklist of 4–6 games (3–10 minutes each, about 20–30 minutes in total) covering all four areas, with a progress bar ("3 of 5 done"). The parent can swap a game or add one from the library.
3. **Playing a game**: open a game → steps, materials, safety note → play → tick it done. Then log:
   - the baby's reaction (loved / okay / not interested)
   - 1–2 "watch for" questions linked to milestones, e.g. *"Did she follow the rattle with her eyes from side to side?"* → Yes / Not yet / Didn't try
   - optional note or photo
4. **Game library**: all games grouped by age band and area, with filters, favourites and custom games.
5. **Milestone tracker**: an age-grouped checklist fed by the game answers. When a "watch for" answer is Yes, the linked milestone is marked seen with that date (the parent can also mark or unmark it by hand). The screen shows what is typical now and what comes next.
6. **Growth log**: enter measurements and see them plotted on WHO percentile curves.
7. **Progress**: checklist completion per day, streak, minutes played this week, games per area (which shows gaps), milestones seen, growth trend, and a timeline of notes and photos.
8. **Daily reminder**: a local notification at a time the parent chooses.

Later phases: cloud sync and two parents sharing one baby; a PDF summary for pediatrician visits; smarter suggestions ("I have 10 minutes", a shorter checklist when time is short, rotate neglected areas).

## Core logic

- `ageDays = today − dob`. If gestation < 37 weeks: `correctedAgeDays = ageDays − (40 − gestationWeeks) × 7`. Use corrected age for games, milestones and charts until 24 months.
- Age bands for games: 0–1, 1–2, 2–3, 3–4, 4–6, 6–9, 9–12, 12–15, 15–18, 18–24 months.
- **Daily checklist:** generated once per day from the current band, with at least one game per area. Yesterday's games are not repeated. Games the baby "loved" come back more often, and games tied to milestones not yet seen are included more often.
- **Milestone from play:** a Yes on a "watch for" question marks the linked milestone as seen on that date. "Not yet" is stored but never shown as a failure.

## Data model

```
Baby          id, name, dob, sex, gestationWeeks?, photo?
Game          id, title, ageMinDays, ageMaxDays, areas[], durationMin,
              materials[], steps[], benefit, safety, isCustom
WatchFor      id, gameId, milestoneId, question
DailyChecklist id, babyId, date, gameIds[]
GameLog       id, babyId, gameId, date, durationMin, reaction, note?, photo?
WatchAnswer   id, gameLogId, watchForId, answer(yes|not_yet|didnt_try)
Milestone     id, ageMonths, area, description, source
MilestoneLog  id, babyId, milestoneId, observedOn, note?
GrowthEntry   id, babyId, date, weightKg?, lengthCm?, headCm?
Settings      reminderTime, units
```

## Screens

Onboarding → Today (checklist) · Games · Milestones · Growth · Progress (bottom tabs), plus Game detail/play screen and Settings/baby switcher.

## Proposed stack (pending decision on platform)

- Expo (React Native) + TypeScript: one codebase for iOS, Android and web.
- Local-first SQLite (`expo-sqlite`) so the MVP works offline and needs no server.
- `react-native-svg` for the growth charts; `expo-notifications` for reminders.
- Phase 2 sync: Supabase.
- Your design system becomes a theme file (colours, type, spacing, components) before any screen is built.

## Content

- Milestones and growth tables come from the public CDC and WHO sources and are cited in the app.
- I can draft about 100 games (roughly 10 per age band), each with its "watch for" questions. Before public release, a pediatrician or early-childhood specialist should review them.

## Build order

1. Scaffold, theme from the design system, navigation shell
2. Baby profile and age calculation, including corrected age
3. Game data, daily checklist, play screen and logging
4. Milestones
5. Growth log and WHO charts
6. Progress screen
7. Daily reminder

## Verification

- Unit tests for age and corrected-age maths, band selection, checklist generation and WHO percentile lookup
- Run the app on web and in Expo Go, then walk through onboarding → complete today's checklist → confirm a milestone is marked from a Yes answer → add a growth entry → check Progress
- Screenshot each screen against the design system

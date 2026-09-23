# Baby Activity Tracker — Product Plan

## Context

Working parents of babies aged 0–24 months have little time with their child and want that time to count. The app gives them a **daily checklist of play games** suited to the baby's age in days. The parent plays each game with the baby, ticks it off, and answers a quick "what did your baby do?" question. Those answers, plus growth measurements, are how the app monitors the baby's development.

## What the app can and can't claim

Play does not measurably change weight or length; feeding, sleep and health do. So the app tracks two things separately and never says a game caused growth:
- **Milestones**: skills the parent sees, from the CDC checklists for 2, 4, 6, 9, 12, 15, 18 and 24 months.
- **Growth**: weight, length and head size plotted on the WHO charts for 0–24 months.

If a milestone hasn't been seen by the expected age, the app gently suggests mentioning it at the next check-up. It gives no scores and it is not a medical tool.

## MVP features

1. **Baby profile**: name, date of birth, sex (needed for the WHO charts), weeks of pregnancy if born early, photo. More than one baby is allowed.
2. **Today's game checklist**: "Day 142 · 4 months 20 days", then 4–6 games of 3–10 minutes each (20–30 minutes in total) covering movement, language, thinking and social-emotional skills. A progress bar shows "3 of 5 done". The parent can swap a game or add one.
3. **Playing a game**: steps, materials and a safety note, then tick it done. After each game the parent logs:
   - the baby's reaction: loved / okay / not interested
   - 1–2 "watch for" questions, e.g. *"Did she follow the rattle with her eyes?"*: Yes / Not yet / Didn't try
   - an optional note or photo
4. **Game library**: games by age and area, with filters, favourites and custom games.
5. **Milestones**: a Yes on a "watch for" question marks the linked milestone as seen on that date. The parent can also mark or unmark milestones by hand.
6. **Growth log**: measurements plotted on the WHO percentile charts.
7. **Progress**: how often the checklist was finished, streak, minutes played, games per area (so gaps show), milestones seen, growth trend, and a timeline of notes.
8. **Daily reminder** at a time the parent chooses (see the web limit below).

Later: syncing between two parents, a PDF summary for doctor visits, and a "10-minute" short checklist.

## Core logic

- `ageDays = today − dob`. If born before 37 weeks: `correctedAgeDays = ageDays − (40 − gestationWeeks) × 7`. Corrected age is used until 24 months.
- Age bands: 0–1, 1–2, 2–3, 3–4, 4–6, 6–9, 9–12, 12–15, 15–18, 18–24 months.
- **Daily checklist rules:**
  - at least one game per area
  - no repeats from yesterday
  - games the baby loved come back more often
  - games that check milestones not yet seen come up more often

## Data model

```
Baby           id, name, dob, sex, gestationWeeks?, photo?
Game           id, title, ageMinDays, ageMaxDays, areas[], durationMin,
               materials[], steps[], benefit, safety, isCustom
WatchFor       id, gameId, milestoneId, question
DailyChecklist id, babyId, date, gameIds[]
GameLog        id, babyId, gameId, date, durationMin, reaction, note?, photo?
WatchAnswer    id, gameLogId, watchForId, answer(yes|not_yet|didnt_try)
Milestone      id, ageMonths, area, description, source
MilestoneLog   id, babyId, milestoneId, observedOn, note?
GrowthEntry    id, babyId, date, weightKg?, lengthCm?, headCm?
Settings       reminderTime, units
```

## Screens

The bottom tabs are Today · Games · Milestones · Growth · Progress. Other screens:
- onboarding
- game play screen
- settings and baby switcher

## Decisions (confirmed)

- **Web only**, mobile-first, installable as a PWA.
- **One device, no login** in v1. Sharing between parents comes in phase 2.
- **Design system:** the sbaby design system; its tokens are applied exactly.

## Stack

- **React 18 + Vite + TypeScript**, React Router, laid out for phone screens.
- **IndexedDB via Dexie**, so data stays in the browser and works offline with no server. Settings will include an export/import JSON backup, because clearing browser data would wipe everything.
- **PWA** (`vite-plugin-pwa`) so it can be added to the home screen and opened offline.
- **Charts:** hand-built SVG for the WHO curves, so the percentile bands look exactly as designed.
- **Tests:** Vitest for the logic; Playwright (Chromium is pre-installed) for the walkthrough.
- **Theme:** sbaby tokens become CSS variables in `src/theme/tokens.css`. Components use only those variables.

## Honest limit: the daily reminder on the web

A website can't reliably schedule a notification for a set time each day unless there is a push server. The Notification Triggers API was dropped by browsers. So v1 does two things:
- **"Add to my calendar":** downloads a repeating daily event (.ics) at the time you choose. Your phone's calendar then reminds you.
- **An in-app banner** when you open the app and today's checklist isn't finished.

Real push reminders need a server, which comes with the phase-2 sync.

## Content

- Milestone and growth data come from the public CDC and WHO sources, cited in the app.
- About 100 games will be drafted, with their "watch for" questions. A pediatrician should review them before public release.

## Project layout

```
src/
  theme/tokens.css         sbaby tokens → CSS variables
  db/schema.ts             Dexie tables (data model above)
  domain/age.ts            ageDays, corrected age, age band, "4 months 20 days"
  domain/checklist.ts      daily checklist generation (pure, seeded by date)
  domain/milestones.ts     Yes answer → MilestoneLog; overdue prompt
  domain/growth.ts         WHO LMS → percentile/z-score
  data/games.ts            ~100 games + WatchFor questions
  data/milestones.ts       CDC 2022 milestones
  data/who/*.json          WHO LMS tables (weight, length, head; boys/girls; 0–24 m)
  screens/                 Onboarding, Today, GamePlay, Library, Milestones, Growth, Progress, Settings
  components/              UI built only from sbaby tokens
```

## Build order

1. Vite scaffold, sbaby theme, navigation
2. Baby profile and age maths
3. Games, daily checklist, play screen, logging
4. Milestones
5. Growth charts
6. Progress
7. Reminder

## Verification

- Unit tests for age and corrected age, checklist generation, milestone-from-answer logic, and the WHO percentile lookup.
- `npm run build` passes; run `vite preview` and use Playwright at phone size (390×844) to walk through: onboarding → finish today's checklist → a Yes answer marks a milestone → add growth → check Progress.
- Screenshot each screen against sbaby.

## v1 status

Built and tested. What differs from the plan above:
- **77 games**, not ~100. Every age band has at least 5 games covering all four areas.
- **No photos** in game logs yet. Notes only, which keeps backups small and simple.
- **Icons:** Lucide rounded icons, because the icons in the Sbaby PDF are embedded images.
- **Thinking area colours:** the PDF has only a blue tint for this area. A blue accent (`#6d9cc9`) and a blue text colour (`#36648f`) were added.

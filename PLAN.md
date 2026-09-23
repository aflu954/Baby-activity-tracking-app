# Baby Activity Tracker — Product Plan

## Context

Working parents of babies aged 0–24 months have little time with their child and want that time to count: activities the baby enjoys that also support development. Today a parent has to work out what suits each age, keeps no record of what they did, and can't easily see how the baby is progressing.

The app knows the baby's age in days, gives a short activity checklist for today, records what was done, and tracks development. Building starts once the design system is provided.

## A constraint the app has to respect

Play activities do not measurably drive weight or length; feeding, sleep and health do. So the app tracks two separate signals and never claims an activity caused growth:

- **Developmental milestones**: observed skills, from the CDC "Learn the Signs. Act Early." checklists (2022 revision: 2, 4, 6, 9, 12, 15, 18, 24 months).
- **Physical growth**: weight, length and head circumference against the WHO Child Growth Standards percentiles (the standard for 0–24 months).

Each activity is tagged with the area it exercises (motor, language, cognitive, social-emotional). The app shows activities done and milestones reached side by side, per area. If an expected milestone is still unmarked after its age, the app shows a gentle prompt to mention it at the next check-up. It gives no scores and no "behind" labels, and it is not a medical tool.

## MVP features

1. **Baby profile**: name, date of birth, sex (the WHO charts need it), weeks of gestation if born early (for corrected age), optional photo. More than one baby is supported.
2. **Today screen**: header like "Day 142 · 4 months 20 days", then 3–5 suggested activities balanced across areas. For each one, tap to complete and log the duration, the baby's reaction (loved / okay / not interested) and an optional note.
3. **Activity library**: activities grouped by age band and area. Each has steps, materials, time needed, why it helps and safety notes. Supports filtering, favourites and custom activities.
4. **Milestone tracker**: an age-grouped checklist. Mark a milestone "seen" with a date. The screen shows what is typical now and what comes next.
5. **Growth log**: enter measurements and see them plotted on WHO percentile curves.
6. **Progress**: streak, minutes this week, activities per area (which shows gaps), milestones reached, and a timeline of notes.
7. **Daily reminder**: a local notification at a time the parent chooses.

Later phases: cloud sync and two parents sharing one baby; a PDF summary for pediatrician visits; smarter suggestions ("I have 10 minutes", prefer activities the baby loved, rotate neglected areas).

## Core logic

- `ageDays = today − dob`. If gestation < 37 weeks: `correctedAgeDays = ageDays − (40 − gestationWeeks) × 7`. Use corrected age for activities, milestones and charts until 24 months.
- Age bands for activities: 0–1, 1–2, 2–3, 3–4, 4–6, 6–9, 9–12, 12–15, 15–18, 18–24 months.
- Daily picks come from the current band. Across a week, every area gets at least one activity. Yesterday's picks are not repeated, and activities rated "loved" are preferred.

## Data model

```
Baby          id, name, dob, sex, gestationWeeks?, photo?
Activity      id, title, ageMinDays, ageMaxDays, areas[], durationMin,
              materials[], steps[], benefit, safety, isCustom
ActivityLog   id, babyId, activityId, date, durationMin, reaction, note?
Milestone     id, ageMonths, area, description, source
MilestoneLog  id, babyId, milestoneId, observedOn, note?
GrowthEntry   id, babyId, date, weightKg?, lengthCm?, headCm?
Settings      reminderTime, units
```

## Screens

Onboarding → Today · Library · Milestones · Growth · Progress (bottom tabs), plus Activity detail and Settings/baby switcher.

## Proposed stack (pending decision on platform)

- Expo (React Native) + TypeScript: one codebase for iOS, Android and web.
- Local-first SQLite (`expo-sqlite`) so the MVP works offline and needs no server.
- `react-native-svg` for the growth charts; `expo-notifications` for reminders.
- Phase 2 sync: Supabase.
- Your design system becomes a theme file (colours, type, spacing, components) before any screen is built.

## Content

- Milestones and growth tables come from the public CDC and WHO sources and are cited in the app.
- I can draft about 100 activities (roughly 10 per age band). Before public release, a pediatrician or early-childhood specialist should review them.

## Build order

1. Scaffold, theme from the design system, navigation shell
2. Baby profile and age calculation, including corrected age
3. Activity data, Today screen and logging
4. Milestones
5. Growth log and WHO charts
6. Progress screen
7. Daily reminder

## Verification

- Unit tests for age and corrected-age maths, band selection, suggestion rotation and WHO percentile lookup
- Run the app on web and in Expo Go, then walk through onboarding → complete an activity → mark a milestone → add a growth entry → check Progress
- Screenshot each screen against the design system

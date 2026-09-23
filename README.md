# Sbaby Play — baby activity tracker

A mobile-first web app (installable PWA) for parents of babies aged 0–24 months. Each day it gives you a short **checklist of play games** for your baby's exact age. You play, tick each game off, and answer a quick "what did your baby do?" question. Those answers mark **developmental milestones** (CDC 2022). You can also log weight, length and head size, which are plotted on the **WHO growth charts**.

See [PLAN.md](PLAN.md) for the full product plan.

## Features (v1)

- Baby profile with corrected age for babies born before 37 weeks; more than one baby supported
- **Today:** a daily checklist of 5 games covering movement, language, thinking and social skills
  - swap any game, or add one from the library
  - play timer, reaction (loved / okay / not interested), watch-for questions and notes
- **Games:** a library of 77 games with search, area filters, favourites and your own custom games
- **Moments:** 100 CDC milestones across 2–24 months
  - a Yes answer in a game marks the milestone
  - you can tick milestones by hand
  - a gentle check-up note appears for the latest checkpoint
- **Growth:** WHO percentiles and a chart for weight, length and head; metric or imperial
- **Progress:** week view, streak, minutes played, games by area, notes
- **Reminder:** an "Add to my calendar" file that repeats daily, plus an in-app banner
- **Offline and private:** data stays in this browser (IndexedDB); backup and restore are in Settings

## Design

The UI follows the **Sbaby design system**: Poppins type, warm cream surfaces, coral, lavender, green and yellow accents, 20px gutters and rounded cards. The tokens are in `src/theme/tokens.css`. Their values were taken directly from `Sbaby_Design_System.pdf`.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # typecheck + production build
npm run preview    # serve the build on :4173
npm run e2e        # phone-size walkthrough against the preview server (Playwright)
                   # set CHROMIUM_PATH to use a pre-installed Chromium
```

## Data sources

- **Growth:** WHO Child Growth Standards (2006), LMS tables by day of age, taken from the official [WHO `anthro` package](https://github.com/WorldHealthOrganization/anthro). `npm run who:build` regenerates `src/data/who-lms.json` from `scripts/who/`.
- **Milestones:** adapted from the CDC "Learn the Signs. Act Early." checklists (2022).
- **Games:** written for this app. They should be reviewed by a pediatrician or early-childhood specialist before public release.

This app is not a medical device. Play supports bonding and helps parents notice development; it does not diagnose anything or cause growth on its own.

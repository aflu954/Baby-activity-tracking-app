import { describe, expect, it } from 'vitest';
import { GAMES } from '../data/games';
import { AREAS, MILESTONES_BY_ID } from '../data/milestones';
import { AGE_BANDS } from './age';
import { buildChecklist, gameFitsAge } from './checklist';

const base = { games: GAMES, yesterdayIds: [], lovedIds: new Set<string>(), seenMilestoneIds: new Set<string>() };

describe('game content', () => {
  it('has unique ids and valid milestone links', () => {
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
    for (const g of GAMES) {
      expect(g.watchFor.length, g.id).toBeGreaterThan(0);
      for (const w of g.watchFor) expect(MILESTONES_BY_ID.has(w.milestoneId), `${g.id} → ${w.milestoneId}`).toBe(true);
    }
  });

  it('has at least 5 games covering all four areas in every age band', () => {
    for (const band of AGE_BANDS) {
      for (const day of [band.minDays, band.maxDays]) {
        const fits = GAMES.filter((g) => gameFitsAge(g, day));
        expect(fits.length, `${band.label} day ${day}`).toBeGreaterThanOrEqual(5);
        for (const area of AREAS) expect(fits.some((g) => g.areas.includes(area)), `${band.label} ${area}`).toBe(true);
      }
    }
  });
});

describe('buildChecklist', () => {
  it('is the same for the same baby and day', () => {
    const a = buildChecklist({ ...base, seed: 'b1:2026-09-23', ageDays: 140 });
    const b = buildChecklist({ ...base, seed: 'b1:2026-09-23', ageDays: 140 });
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
  });

  it('covers every area and only picks age-appropriate games', () => {
    for (let day = 0; day <= 730; day += 13) {
      const ids = buildChecklist({ ...base, seed: `s${day}`, ageDays: day });
      const games = ids.map((id) => GAMES.find((g) => g.id === id)!);
      expect(new Set(ids).size).toBe(ids.length);
      games.forEach((g) => expect(gameFitsAge(g, day)).toBe(true));
      for (const area of AREAS) expect(games.some((g) => g.areas.includes(area)), `day ${day} ${area}`).toBe(true);
    }
  });

  it('avoids yesterday\'s games when there are enough others', () => {
    const yesterday = buildChecklist({ ...base, seed: 'y', ageDays: 300 });
    const today = buildChecklist({ ...base, seed: 't', ageDays: 300, yesterdayIds: yesterday });
    expect(today.filter((id) => yesterday.includes(id))).toEqual([]);
  });

  it('picks loved games more often', () => {
    const loved = new Set(['coo-chat']);
    let withLove = 0;
    let without = 0;
    for (let i = 0; i < 400; i++) {
      if (buildChecklist({ ...base, seed: `l${i}`, ageDays: 100, lovedIds: loved }).includes('coo-chat')) withLove++;
      if (buildChecklist({ ...base, seed: `l${i}`, ageDays: 100 }).includes('coo-chat')) without++;
    }
    expect(withLove).toBeGreaterThan(without);
  });
});

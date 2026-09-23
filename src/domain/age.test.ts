import { describe, expect, it } from 'vitest';
import { AGE_BANDS, ageBandIndex, ageInDays, effectiveAgeDays, formatAge, monthsAndDays } from './age';

describe('age', () => {
  it('counts the day of birth as day 0', () => {
    expect(ageInDays('2026-05-14', '2026-05-14')).toBe(0);
    expect(ageInDays('2026-05-14', '2026-09-23')).toBe(132);
  });

  it('is not thrown off by daylight-saving changes', () => {
    expect(ageInDays('2026-03-01', '2026-04-01')).toBe(31);
    expect(ageInDays('2026-10-01', '2026-11-01')).toBe(31);
  });

  it('formats months and days', () => {
    expect(formatAge('2026-05-14', '2026-09-23')).toBe('4 months 9 days');
    expect(formatAge('2026-05-14', '2026-06-14')).toBe('1 month');
    expect(formatAge('2026-05-14', '2026-05-20')).toBe('6 days');
  });

  it('handles month-end birthdays', () => {
    expect(monthsAndDays('2026-01-31', '2026-02-28')).toEqual({ months: 0, days: 28 });
    expect(monthsAndDays('2026-01-31', '2026-03-31')).toEqual({ months: 2, days: 0 });
  });

  it('corrects age for babies born before 37 weeks', () => {
    // Born at 32 weeks: 8 weeks early = 56 days.
    expect(effectiveAgeDays('2026-01-01', '2026-04-01', 32)).toBe(90 - 56);
    expect(effectiveAgeDays('2026-01-01', '2026-01-10', 32)).toBe(0);
  });

  it('does not correct term babies or children over 24 months', () => {
    expect(effectiveAgeDays('2026-01-01', '2026-04-01', 38)).toBe(90);
    expect(effectiveAgeDays('2024-01-01', '2026-02-01', 30)).toBe(ageInDays('2024-01-01', '2026-02-01'));
  });

  it('covers every day from 0 to 730 with exactly one age band', () => {
    for (let d = 0; d <= 730; d++) {
      const hits = AGE_BANDS.filter((b) => d >= b.minDays && d <= b.maxDays);
      expect(hits.length, `day ${d}`).toBe(1);
    }
    expect(ageBandIndex(0)).toBe(0);
    expect(ageBandIndex(730)).toBe(AGE_BANDS.length - 1);
  });
});

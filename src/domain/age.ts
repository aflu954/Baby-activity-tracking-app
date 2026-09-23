export const DAY_MS = 86_400_000;
export const MAX_AGE_DAYS = 731; // 24 months

/** Local calendar date as YYYY-MM-DD. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from `fromIso` to `toIso` (DST-safe). */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = parseISODate(fromIso);
  const b = parseISODate(toIso);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Chronological age in days; day of birth is day 0. */
export function ageInDays(dob: string, today: string): number {
  return daysBetween(dob, today);
}

/**
 * Age used for games, milestones and growth charts.
 * Babies born before 37 weeks use corrected age until 24 months (chronological).
 */
export function effectiveAgeDays(dob: string, today: string, gestationWeeks?: number): number {
  const chrono = ageInDays(dob, today);
  if (!gestationWeeks || gestationWeeks >= 37 || chrono > MAX_AGE_DAYS) return chrono;
  const correction = Math.round((40 - gestationWeeks) * 7);
  return Math.max(0, chrono - correction);
}

export function isCorrected(dob: string, today: string, gestationWeeks?: number): boolean {
  return effectiveAgeDays(dob, today, gestationWeeks) !== ageInDays(dob, today);
}

/** Calendar months and remaining days, e.g. 4 months 20 days. */
export function monthsAndDays(dob: string, today: string, offsetDays = 0): { months: number; days: number } {
  const birth = parseISODate(dob);
  const now = parseISODate(addDays(today, -offsetDays));
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return { months: 0, days: 0 };
  const anchor = new Date(birth);
  anchor.setMonth(anchor.getMonth() + months);
  // setMonth overflows short months (e.g. Jan 31 + 1 month); clamp to month end.
  if (anchor.getDate() !== birth.getDate()) anchor.setDate(0);
  return { months, days: daysBetween(toISODate(anchor), toISODate(now)) };
}

export function formatAge(dob: string, today: string, gestationWeeks?: number): string {
  const offset = ageInDays(dob, today) - effectiveAgeDays(dob, today, gestationWeeks);
  const { months, days } = monthsAndDays(dob, today, offset);
  const m = months === 1 ? '1 month' : `${months} months`;
  const d = days === 1 ? '1 day' : `${days} days`;
  if (months === 0) return d;
  return days === 0 ? m : `${m} ${d}`;
}

/** Age in months as a decimal (average month length), for chart axes. */
export function daysToMonths(days: number): number {
  return days / 30.4375;
}

export const AGE_BANDS: { label: string; minDays: number; maxDays: number }[] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 6], [6, 9], [9, 12], [12, 15], [15, 18], [18, 24],
].map(([a, b]) => ({
  label: `${a}–${b} months`,
  minDays: Math.round(a * 30.4375),
  maxDays: Math.round(b * 30.4375) - 1,
}));

export function ageBandIndex(ageDays: number): number {
  const i = AGE_BANDS.findIndex((b) => ageDays >= b.minDays && ageDays <= b.maxDays);
  return i === -1 ? AGE_BANDS.length - 1 : i;
}

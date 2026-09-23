import who from '../data/who-lms.json';

export type Sex = 'male' | 'female';
export type Measure = 'weight' | 'length' | 'head';
type LMS = [number, number, number];

const tables = who as unknown as Record<Measure, Record<Sex, LMS[]>> & { maxDay: number };

export const MEASURE_UNITS: Record<Measure, string> = { weight: 'kg', length: 'cm', head: 'cm' };
export const MEASURE_LABELS: Record<Measure, string> = { weight: 'Weight', length: 'Length', head: 'Head' };

function lms(measure: Measure, sex: Sex, ageDays: number): LMS | undefined {
  if (ageDays < 0 || ageDays > tables.maxDay) return undefined;
  return tables[measure][sex][Math.round(ageDays)];
}

function valueAtZ([l, m, s]: LMS, z: number): number {
  return l === 0 ? m * Math.exp(s * z) : m * Math.pow(1 + l * s * z, 1 / l);
}

/**
 * WHO z-score. Weight uses WHO's restricted LMS beyond ±3 SD, as the WHO
 * anthro software does; length and head circumference use plain LMS.
 */
export function zScore(measure: Measure, sex: Sex, ageDays: number, value: number): number | undefined {
  const p = lms(measure, sex, ageDays);
  if (!p || !(value > 0)) return undefined;
  const [l, m, s] = p;
  const z = l === 0 ? Math.log(value / m) / s : (Math.pow(value / m, l) - 1) / (l * s);
  if (measure !== 'weight') return z;
  if (z > 3) {
    const sd3 = valueAtZ(p, 3);
    return 3 + (value - sd3) / (sd3 - valueAtZ(p, 2));
  }
  if (z < -3) {
    const sd3 = valueAtZ(p, -3);
    return -3 + (value - sd3) / (valueAtZ(p, -2) - sd3);
  }
  return z;
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26 via erf; error < 1.5e-7). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t *
    Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export function percentile(measure: Measure, sex: Sex, ageDays: number, value: number): number | undefined {
  const z = zScore(measure, sex, ageDays, value);
  return z === undefined ? undefined : normalCdf(z) * 100;
}

/** "55th", "<1st", ">99th". */
export function formatPercentile(p: number): string {
  if (p < 1) return '<1st';
  if (p > 99) return '>99th';
  const n = Math.round(p);
  const mod100 = n % 100;
  const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** The WHO chart lines: 3rd, 15th, 50th, 85th, 97th percentiles. */
export const CHART_PERCENTILES: { p: number; z: number }[] = [
  { p: 3, z: -1.881 }, { p: 15, z: -1.036 }, { p: 50, z: 0 }, { p: 85, z: 1.036 }, { p: 97, z: 1.881 },
];

export function percentileCurve(measure: Measure, sex: Sex, z: number, fromDay: number, toDay: number, step = 7) {
  const points: { day: number; value: number }[] = [];
  for (let day = Math.max(0, fromDay); day <= Math.min(tables.maxDay, toDay); day += step) {
    points.push({ day, value: valueAtZ(lms(measure, sex, day)!, z) });
  }
  const last = Math.min(tables.maxDay, toDay);
  if (points.at(-1)?.day !== last) points.push({ day: last, value: valueAtZ(lms(measure, sex, last)!, z) });
  return points;
}

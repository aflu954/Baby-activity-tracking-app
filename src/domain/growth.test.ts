import { describe, expect, it } from 'vitest';
import { formatPercentile, normalCdf, percentile, percentileCurve, zScore } from './growth';

// Reference values from the published WHO Child Growth Standards tables.
describe('WHO growth standards', () => {
  it('puts the median at the 50th percentile', () => {
    expect(zScore('weight', 'male', 0, 3.3464)).toBeCloseTo(0, 5);
    expect(percentile('length', 'female', 365, 74.0)).toBeCloseTo(50, 0);
  });

  it('matches published -2 SD values', () => {
    expect(zScore('weight', 'male', 0, 2.459)!).toBeCloseTo(-2, 1); // boys birth -2SD 2.459 kg (expanded table)
    expect(zScore('length', 'male', 0, 46.1)!).toBeCloseTo(-2, 1); // boys birth -2SD 46.1 cm
    expect(zScore('head', 'female', 0, 31.5)!).toBeCloseTo(-2, 1); // girls birth -2SD 31.5 cm
  });

  it('uses the restricted method for weight beyond 3 SD', () => {
    const z = zScore('weight', 'male', 0, 6)!;
    expect(z).toBeGreaterThan(3);
    expect(z).toBeLessThan(8);
  });

  it('returns undefined outside 0–24 months or for bad values', () => {
    expect(zScore('weight', 'male', 800, 12)).toBeUndefined();
    expect(zScore('weight', 'male', 10, 0)).toBeUndefined();
  });

  it('computes the normal CDF', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.881)).toBeCloseTo(0.03, 3);
  });

  it('formats percentiles', () => {
    expect(formatPercentile(55.2)).toBe('55th');
    expect(formatPercentile(1.4)).toBe('1st');
    expect(formatPercentile(22)).toBe('22nd');
    expect(formatPercentile(12)).toBe('12th');
    expect(formatPercentile(0.3)).toBe('<1st');
    expect(formatPercentile(99.6)).toBe('>99th');
  });

  it('builds curves that include both ends', () => {
    const c = percentileCurve('weight', 'female', 0, 0, 120);
    expect(c[0].day).toBe(0);
    expect(c.at(-1)!.day).toBe(120);
  });
});

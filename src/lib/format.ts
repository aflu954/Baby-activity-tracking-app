import { parseISODate } from '../domain/age';
import type { Measure } from '../domain/growth';
import type { Units } from './hooks';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function possessive(name: string): string {
  const n = name.trim().split(/\s+/)[0] || 'Baby';
  return n.endsWith('s') ? `${n}’` : `${n}’s`;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  return parseISODate(iso).toLocaleDateString('en-GB', opts);
}

export function longDate(iso: string): string {
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
}

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

/** Converts a stored metric value to the display unit. */
export function toDisplay(measure: Measure, metric: number, units: Units): number {
  if (units === 'metric') return metric;
  return measure === 'weight' ? metric / KG_PER_LB : metric / CM_PER_IN;
}

export function fromDisplay(measure: Measure, value: number, units: Units): number {
  if (units === 'metric') return value;
  return measure === 'weight' ? value * KG_PER_LB : value * CM_PER_IN;
}

export function unitLabel(measure: Measure, units: Units): string {
  if (measure === 'weight') return units === 'metric' ? 'kg' : 'lb';
  return units === 'metric' ? 'cm' : 'in';
}

export function formatMeasure(measure: Measure, metric: number, units: Units): string {
  const v = toDisplay(measure, metric, units);
  const digits = measure === 'weight' ? (units === 'metric' ? 2 : 1) : 1;
  return `${Number(v.toFixed(digits))} ${unitLabel(measure, units)}`;
}

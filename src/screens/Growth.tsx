import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { GrowthChart } from '../components/GrowthChart';
import { Segmented, Sheet } from '../components/ui';
import type { Baby, GrowthEntry } from '../db/db';
import { db } from '../db/db';
import { saveGrowth } from '../db/actions';
import { effectiveAgeDays, formatAge } from '../domain/age';
import { formatPercentile, MEASURE_LABELS, percentile, type Measure } from '../domain/growth';
import { formatDate, formatMeasure, fromDisplay, toDisplay, unitLabel } from '../lib/format';
import { useUnits, type Units } from '../lib/hooks';

const FIELD: Record<Measure, 'weightKg' | 'lengthCm' | 'headCm'> = { weight: 'weightKg', length: 'lengthCm', head: 'headCm' };

export function Growth({ baby, today }: { baby: Baby; today: string }) {
  const units = useUnits();
  const [measure, setMeasure] = useState<Measure>('weight');
  const [editing, setEditing] = useState<GrowthEntry | 'new' | null>(null);
  const entries = useLiveQuery(() => db.growth.where('babyId').equals(baby.id).toArray(), [baby.id]);
  if (!entries) return <main className="screen" aria-busy="true" />;

  const ageAt = (date: string) => effectiveAgeDays(baby.dob, date, baby.gestationWeeks);
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const withValue = sorted.filter((e) => e[FIELD[measure]] !== undefined);
  const latest = withValue.at(-1);
  const latestValue = latest?.[FIELD[measure]];
  const latestP = latest && latestValue !== undefined ? percentile(measure, baby.sex, ageAt(latest.date), latestValue) : undefined;

  const points = withValue
    .filter((e) => ageAt(e.date) <= 731)
    .map((e) => {
      const v = e[FIELD[measure]]!;
      const p = percentile(measure, baby.sex, ageAt(e.date), v);
      return { day: ageAt(e.date), value: v, label: formatDate(e.date), detail: p === undefined ? '' : `${formatPercentile(p)} percentile` };
    });

  return (
    <main className="screen">
      <header>
        <p className="eyebrow">{formatAge(baby.dob, today, baby.gestationWeeks)}</p>
        <h1 className="h1">Growth</h1>
      </header>

      <Segmented label="Measurement" value={measure} onChange={setMeasure}
        options={[{ value: 'weight', label: 'Weight' }, { value: 'length', label: 'Length' }, { value: 'head', label: 'Head' }]} />

      <section className="card stack">
        <span className="label">Latest</span>
        {latest && latestValue !== undefined ? (
          <div className="split" style={{ alignItems: 'flex-end' }}>
            <div className="stat-big">
              <strong>{Number(toDisplay(measure, latestValue, units).toFixed(measure === 'weight' && units === 'metric' ? 2 : 1))}</strong>
              <small>{unitLabel(measure, units)}</small>
            </div>
            {latestP !== undefined && (
              <div style={{ textAlign: 'right' }}>
                <div className="title" style={{ color: 'var(--green-text)' }}>{formatPercentile(latestP)}</div>
                <div className="caption">percentile · {formatDate(latest.date)}</div>
              </div>
            )}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>No {MEASURE_LABELS[measure].toLowerCase()} yet. Add one from your last check-up or home scale.</p>
        )}
        <GrowthChart measure={measure} sex={baby.sex} points={points} ageDays={ageAt(today)} units={units} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="title">Measurements</h2>
          <button type="button" className="link" onClick={() => setEditing('new')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Plus size={16} aria-hidden /> Add</button>
        </div>
        {sorted.length === 0 ? <p className="empty" style={{ padding: 12 }}>No measurements yet.</p> : (
          <div className="list">
            {[...sorted].reverse().map((e) => (
              <button key={e.id} type="button" className="row" onClick={() => setEditing(e)}>
                <div className="row-main">
                  <div className="title">
                    {[e.weightKg !== undefined && formatMeasure('weight', e.weightKg, units), e.lengthCm !== undefined && formatMeasure('length', e.lengthCm, units), e.headCm !== undefined && `head ${formatMeasure('head', e.headCm, units)}`].filter(Boolean).join(' · ')}
                  </div>
                  <div className="row-meta">{e.where || 'Measurement'}</div>
                </div>
                <span className="row-end">{formatDate(e.date)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <p className="footer-note">Percentiles use the WHO Child Growth Standards{baby.gestationWeeks && baby.gestationWeeks < 37 ? ' at corrected age' : ''}. One reading says little — the trend over time matters more. Ask your doctor about any concerns.</p>

      {editing && <GrowthSheet baby={baby} today={today} units={units} entry={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </main>
  );
}

function GrowthSheet({ baby, today, units, entry, onClose }: { baby: Baby; today: string; units: Units; entry?: GrowthEntry; onClose: () => void }) {
  const init = (m: Measure) => {
    const v = entry?.[FIELD[m]];
    return v === undefined ? '' : String(Number(toDisplay(m, v, units).toFixed(2)));
  };
  const [date, setDate] = useState(entry?.date ?? today);
  const [vals, setVals] = useState<Record<Measure, string>>({ weight: init('weight'), length: init('length'), head: init('head') });
  const [where, setWhere] = useState(entry?.where ?? '');
  const [error, setError] = useState('');

  const save = async () => {
    const parsed: Partial<Record<Measure, number>> = {};
    for (const m of ['weight', 'length', 'head'] as Measure[]) {
      if (vals[m].trim() === '') continue;
      const n = Number(vals[m].replace(',', '.'));
      if (!(n > 0)) return setError(`${MEASURE_LABELS[m]} doesn’t look right.`);
      parsed[m] = fromDisplay(m, n, units);
    }
    if (Object.keys(parsed).length === 0) return setError('Enter at least one measurement.');
    if (date < baby.dob || date > today) return setError('The date must be between birth and today.');
    const ranges: Record<Measure, [number, number]> = { weight: [0.4, 25], length: [25, 110], head: [20, 60] };
    for (const [m, v] of Object.entries(parsed) as [Measure, number][]) {
      if (v < ranges[m][0] || v > ranges[m][1]) return setError(`${MEASURE_LABELS[m]} looks out of range — check the units.`);
    }
    await saveGrowth({ id: entry?.id, babyId: baby.id, date, weightKg: parsed.weight, lengthCm: parsed.length, headCm: parsed.head, where: where.trim() || undefined });
    onClose();
  };

  return (
    <Sheet title={entry ? 'Edit measurement' : 'Add measurement'} onClose={onClose}>
      <label className="field"><span>Date</span><input className="input" type="date" value={date} min={baby.dob} max={today} onChange={(e) => setDate(e.target.value)} /></label>
      <div className="row-inputs">
        {(['weight', 'length', 'head'] as Measure[]).map((m) => (
          <label key={m} className="field">
            <span>{MEASURE_LABELS[m]} ({unitLabel(m, units)})</span>
            <input className="input" inputMode="decimal" value={vals[m]} onChange={(e) => setVals((s) => ({ ...s, [m]: e.target.value }))} />
          </label>
        ))}
      </div>
      <label className="field"><span>Where (optional)</span><input className="input" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Clinic, home scale…" /></label>
      {error && <div className="banner" role="alert">{error}</div>}
      <button type="button" className="btn" onClick={save}>Save</button>
      {entry && (
        <button type="button" className="btn ghost" onClick={async () => { await db.growth.delete(entry.id); onClose(); }}>
          <Trash2 size={16} aria-hidden /> Delete
        </button>
      )}
    </Sheet>
  );
}

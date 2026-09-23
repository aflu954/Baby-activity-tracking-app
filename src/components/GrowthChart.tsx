import { useMemo, useState } from 'react';
import { CHART_PERCENTILES, percentileCurve, type Measure, type Sex } from '../domain/growth';
import { daysToMonths } from '../domain/age';
import { toDisplay, unitLabel } from '../lib/format';
import type { Units } from '../lib/hooks';

export interface ChartPoint { day: number; value: number; label: string; detail: string }

const W = 350;
const H = 230;
const PAD = { l: 36, r: 12, t: 12, b: 28 };

/**
 * Baby's measurements over the WHO 3rd–97th percentile band, with the 15th/85th
 * and median lines. Reference lines are recessive neutrals; the baby's line is the
 * only coloured series.
 */
export function GrowthChart({ measure, sex, points, ageDays, units }: {
  measure: Measure; sex: Sex; points: ChartPoint[]; ageDays: number; units: Units;
}) {
  const [active, setActive] = useState<number | null>(null);
  const maxDay = Math.min(731, Math.max(120, ageDays + 45, ...points.map((p) => p.day + 30)));

  const curves = useMemo(
    () => CHART_PERCENTILES.map((c) => ({ ...c, pts: percentileCurve(measure, sex, c.z, 0, maxDay, 7).map((p) => ({ day: p.day, value: toDisplay(measure, p.value, units) })) })),
    [measure, sex, maxDay, units],
  );
  const shown = points.map((p) => ({ ...p, v: toDisplay(measure, p.value, units) }));

  const all = [...curves.flatMap((c) => c.pts.map((p) => p.value)), ...shown.map((p) => p.v)];
  const lo = Math.floor(Math.min(...all));
  const hi = Math.ceil(Math.max(...all));
  const x = (d: number) => PAD.l + (d / maxDay) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b);
  const path = (pts: { day: number; value: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join('');

  const band = curves[0].pts.length
    ? `${path(curves[4].pts)}L${[...curves[0].pts].reverse().map((p) => `${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join('L')}Z`
    : '';

  const maxMonth = Math.floor(daysToMonths(maxDay));
  const monthStep = maxMonth > 12 ? 3 : maxMonth > 6 ? 2 : 1;
  const xTicks = Array.from({ length: Math.floor(maxMonth / monthStep) + 1 }, (_, i) => i * monthStep);
  const yStep = Math.max(1, Math.round((hi - lo) / 4));
  const yTicks = Array.from({ length: Math.floor((hi - lo) / yStep) + 1 }, (_, i) => lo + i * yStep);
  const unit = unitLabel(measure, units);
  const act = active !== null ? shown[active] : undefined;

  return (
    <figure style={{ margin: 0, position: 'relative' }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${measure} chart with WHO percentile lines; ${points.length} measurement${points.length === 1 ? '' : 's'}`}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--ink-muted)" fontFamily="var(--font)">{t}</text>
          </g>
        ))}
        {xTicks.map((m) => (
          <text key={m} x={x(m * 30.4375)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--ink-muted)" fontFamily="var(--font)">
            {m === 0 ? 'Birth' : `${m} mo`}
          </text>
        ))}
        <path d={band} fill="var(--surface-subtle)" />
        {curves.map((c) => (
          <path key={c.p} d={path(c.pts)} fill="none" stroke={c.p === 50 ? 'var(--ink-muted)' : 'var(--border)'}
            strokeWidth={c.p === 50 ? 1.5 : 1} strokeDasharray={c.p === 50 ? '4 4' : undefined} />
        ))}
        {[3, 50, 97].map((p) => {
          const c = curves.find((k) => k.p === p)!;
          const last = c.pts.at(-1)!;
          return <text key={p} x={x(last.day) - 2} y={y(last.value) - 4} textAnchor="end" fontSize="9" fill="var(--ink-muted)" fontFamily="var(--font)">{p === 3 ? "3rd" : `${p}th`}</text>;
        })}
        <line x1={x(ageDays)} x2={x(ageDays)} y1={PAD.t} y2={H - PAD.b} stroke="var(--coral)" strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
        {shown.length > 1 && <path d={path(shown.map((p) => ({ day: p.day, value: p.v })))} fill="none" stroke="var(--green)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {shown.map((p, i) => (
          <g key={i}>
            <circle cx={x(p.day)} cy={y(p.v)} r={active === i ? 6 : 5} fill="var(--green-text)" stroke="var(--surface-card)" strokeWidth={2} />
            <circle cx={x(p.day)} cy={y(p.v)} r={16} fill="transparent" style={{ cursor: 'pointer' }}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onClick={() => setActive(active === i ? null : i)}>
              <title>{`${p.label}: ${p.detail}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      {act && (
        <div role="status" style={{
          position: 'absolute', top: 4, left: `${Math.min(70, Math.max(0, (x(act.day) / W) * 100 - 15))}%`,
          background: 'var(--ink)', color: 'var(--on-dark)', borderRadius: 12, padding: '6px 10px', font: 'var(--caption)', pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          <strong>{act.v.toFixed(measure === 'weight' ? 2 : 1)} {unit}</strong> · {act.label}<br />{act.detail}
        </div>
      )}
      <figcaption className="legend" style={{ marginTop: 8 }}>
        <span><i style={{ background: 'var(--green-text)' }} />Your baby</span>
        <span><i style={{ background: 'var(--ink-muted)' }} />WHO median</span>
        <span><i style={{ background: 'var(--surface-subtle)', height: 8, border: '1px solid var(--border)' }} />3rd–97th</span>
      </figcaption>
    </figure>
  );
}

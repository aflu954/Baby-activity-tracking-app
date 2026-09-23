import { useLiveQuery } from 'dexie-react-hooks';
import { Flame } from 'lucide-react';
import { AreaIcon, ProgressBar } from '../components/ui';
import { AREAS, AREA_LABELS } from '../data/milestones';
import type { Baby } from '../db/db';
import { db } from '../db/db';
import { addDays, parseISODate } from '../domain/age';
import { formatDate } from '../lib/format';
import { useGames } from '../lib/hooks';
import { REACTION_META } from './Today';

export function Progress({ baby, today }: { baby: Baby; today: string }) {
  const games = useGames();
  const data = useLiveQuery(async () => ({
    logs: await db.gameLogs.where('babyId').equals(baby.id).toArray(),
    checklists: await db.checklists.where('babyId').equals(baby.id).toArray(),
    milestones: await db.milestoneLogs.where('babyId').equals(baby.id).count(),
  }), [baby.id]);
  if (!data || !games) return <main className="screen" aria-busy="true" />;

  const byId = new Map(games.map((g) => [g.id, g]));
  const logsByDate = new Map<string, typeof data.logs>();
  for (const l of data.logs) logsByDate.set(l.date, [...(logsByDate.get(l.date) ?? []), l]);
  const checklistByDate = new Map(data.checklists.map((c) => [c.date, c.gameIds]));

  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const weekMinutes = week.reduce((s, d) => s + (logsByDate.get(d) ?? []).reduce((a, l) => a + l.minutes, 0), 0);
  const weekDaysPlayed = week.filter((d) => logsByDate.has(d)).length;

  // Streak: consecutive days with at least one game, ending today (or yesterday if today isn't started yet).
  let streak = 0;
  let cursor = logsByDate.has(today) ? today : addDays(today, -1);
  while (logsByDate.has(cursor)) { streak++; cursor = addDays(cursor, -1); }

  const monthStart = addDays(today, -29);
  const recent = data.logs.filter((l) => l.date >= monthStart);
  const perArea = AREAS.map((a) => ({ area: a, count: recent.filter((l) => byId.get(l.gameId)?.areas.includes(a)).length }));
  const maxArea = Math.max(1, ...perArea.map((p) => p.count));
  const gap = recent.length >= 4 ? perArea.reduce((min, p) => (p.count < min.count ? p : min)) : undefined;
  const notes = [...data.logs].filter((l) => l.note).sort((a, b) => b.createdAt - a.createdAt).slice(0, 15);

  return (
    <main className="screen">
      <header>
        <p className="eyebrow">Last 7 days</p>
        <h1 className="h1">Progress</h1>
      </header>

      <section className="card stack" aria-label="This week">
        <div className="week">
          {week.map((d) => {
            const done = new Set((logsByDate.get(d) ?? []).map((l) => l.gameId));
            const planned = checklistByDate.get(d) ?? [];
            const count = planned.filter((id) => done.has(id)).length;
            const full = planned.length > 0 && count === planned.length;
            return (
              <div key={d}>
                {parseISODate(d).toLocaleDateString('en-GB', { weekday: 'narrow' })}
                <span className={`ring${full ? ' full' : done.size > 0 ? ' part' : ''}${d === today ? ' today' : ''}`}
                  aria-label={`${formatDate(d)}: ${done.size} game${done.size === 1 ? '' : 's'} played`}>{done.size || ''}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <span className="label">Streak</span>
          <div className="stat-big" style={{ marginTop: 4 }}><strong style={{ fontSize: 32 }}>{streak}</strong><small>day{streak === 1 ? '' : 's'}</small></div>
          <div className="caption" style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Flame size={14} color="var(--coral-text)" aria-hidden /> in a row</div>
        </section>
        <section className="card">
          <span className="label">This week</span>
          <div className="stat-big" style={{ marginTop: 4 }}><strong style={{ fontSize: 32 }}>{weekMinutes}</strong><small>min</small></div>
          <div className="caption">{weekDaysPlayed} of 7 days played</div>
        </section>
      </div>

      <section className="card" aria-labelledby="areas-h">
        <div className="card-head">
          <h2 id="areas-h" className="title">Games by area</h2>
          <span className="caption">last 30 days</span>
        </div>
        {perArea.map(({ area, count }) => (
          <div key={area} className="goal" data-area={area}>
            <div className="goal-row">
              <span className="caption" style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--ink-2)' }}><span style={{ color: 'var(--area-text)' }}><AreaIcon area={area} size={16} /></span>{AREA_LABELS[area]}</span>
              <span className="goal-value" style={{ fontSize: 15 }}>{count}</span>
            </div>
            <ProgressBar value={count} max={maxArea} color="var(--area)" label={`${AREA_LABELS[area]} games in the last 30 days`} />
          </div>
        ))}
        {gap && gap.count < maxArea / 2 && (
          <p className="caption" style={{ marginBottom: 0 }}>Fewer {AREA_LABELS[gap.area].toLowerCase()} games lately — tomorrow’s checklist will still include at least one.</p>
        )}
      </section>

      <section className="card">
        <div className="split">
          <div>
            <span className="label">Moments seen</span>
            <div className="title" style={{ fontSize: 22 }}>{data.milestones}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="label">Games played</span>
            <div className="title" style={{ fontSize: 22 }}>{data.logs.length}</div>
          </div>
        </div>
      </section>

      <section className="card" aria-labelledby="notes-h">
        <h2 id="notes-h" className="title" style={{ marginBottom: 4 }}>Notes</h2>
        {notes.length === 0 ? <p className="empty" style={{ padding: 12 }}>Notes you add after a game show up here.</p> : (
          <div className="list">
            {notes.map((l) => {
              const g = byId.get(l.gameId);
              const R = REACTION_META[l.reaction];
              return (
                <div key={l.id} className="row" data-area={g?.areas[0] ?? 'social'}>
                  <span className="row-icon"><R.icon size={20} aria-hidden /></span>
                  <div className="row-main">
                    <div className="row-meta">{g?.title ?? 'Game'} · {formatDate(l.date)}</div>
                    <div style={{ color: 'var(--ink-2)' }}>{l.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

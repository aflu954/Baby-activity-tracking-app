import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, Check, Frown, Meh, Plus, Shuffle, Smile } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AreaDots, AreaIcon, ProgressBar } from '../components/ui';
import { AREAS, AREA_LABELS } from '../data/milestones';
import type { Baby, Reaction } from '../db/db';
import { db } from '../db/db';
import { ensureChecklist, swapGame } from '../db/actions';
import { ageInDays, formatAge, isCorrected } from '../domain/age';
import { useGames, useSetting } from '../lib/hooks';
import { initials, longDate, possessive } from '../lib/format';

export const REACTION_META: Record<Reaction, { label: string; icon: typeof Smile }> = {
  loved: { label: 'Loved it', icon: Smile },
  okay: { label: 'Okay', icon: Meh },
  not_interested: { label: 'Not interested', icon: Frown },
};

export function Today({ baby, today }: { baby: Baby; today: string }) {
  const navigate = useNavigate();
  const games = useGames();
  const dailyMinutes = useSetting('dailyMinutes', 20);
  const reminderTime = useSetting<string | null>('reminderTime', null);

  useEffect(() => { void ensureChecklist(baby, today); }, [baby, today]);

  const checklist = useLiveQuery(() => db.checklists.get([baby.id, today]), [baby.id, today]);
  const logs = useLiveQuery(() => db.gameLogs.where('[babyId+date]').equals([baby.id, today]).toArray(), [baby.id, today]) ?? [];

  if (!games || !checklist) return <main className="screen" aria-busy="true" />;

  const byId = new Map(games.map((g) => [g.id, g]));
  const items = checklist.gameIds.map((id) => byId.get(id)).filter((g) => g !== undefined);
  const doneIds = new Set(logs.map((l) => l.gameId));
  const doneCount = items.filter((g) => doneIds.has(g.id)).length;
  const minutes = logs.reduce((s, l) => s + l.minutes, 0);
  const allDone = items.length > 0 && doneCount === items.length;
  const dayNumber = ageInDays(baby.dob, today);
  const corrected = isCorrected(baby.dob, today, baby.gestationWeeks);
  const now = new Date();
  const pastReminder = reminderTime && `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` >= reminderTime;

  return (
    <main className="screen">
      <header className="header">
        <div>
          <p className="eyebrow">{longDate(today)}</p>
          <h1 className="h1">{possessive(baby.name)} day</h1>
        </div>
        <Link to="/settings" className="avatar" aria-label="Settings and baby profile">{initials(baby.name)}</Link>
      </header>

      {pastReminder && !allDone && (
        <div className="banner" role="status"><Bell size={18} aria-hidden /> It’s play time — {items.length - doneCount} game{items.length - doneCount === 1 ? '' : 's'} left today.</div>
      )}

      <section className="hero" aria-label="Today’s play">
        <span className="label">Today’s play</span>
        <div className="hero-row">
          <div className="hero-num">{doneCount}<small>of {items.length} games</small></div>
          <span className={`pill ${allDone ? '' : doneCount > 0 ? 'yellow' : 'coral'}`}>
            {allDone ? 'All done' : doneCount > 0 ? 'In progress' : 'Let’s play'}
          </span>
        </div>
        <span className="hero-sub">
          Day {dayNumber} · {formatAge(baby.dob, today, baby.gestationWeeks)}{corrected ? ' (corrected)' : ''} · {minutes} min played
        </span>
      </section>

      <nav className="tiles" aria-label="Games by area">
        {AREAS.map((area) => (
          <Link key={area} to={`/games?area=${area}`} className="tile" data-area={area}>
            <span className="tile-icon"><AreaIcon area={area} /></span>
            <span>{AREA_LABELS[area].split(' ')[0]}</span>
          </Link>
        ))}
      </nav>

      <section className="card" aria-labelledby="checklist-h">
        <div className="card-head">
          <h2 id="checklist-h" className="title">Today’s checklist</h2>
          <span className="caption">{items.reduce((s, g) => s + g.minutes, 0)} min</span>
        </div>
        <ul className="list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {items.map((g) => {
            const done = doneIds.has(g.id);
            return (
              <li key={g.id} className={`game-item${done ? ' done' : ''}`}>
                <button
                  type="button"
                  className={`check round${done ? ' on' : ''}`}
                  aria-label={done ? `${g.title} done` : `Play ${g.title}`}
                  onClick={() => !done && navigate(`/game/${g.id}?play=1`)}
                >
                  {done && <Check size={16} strokeWidth={3} color="var(--ink)" />}
                </button>
                <Link to={`/game/${g.id}`}>
                  <span className="title" style={{ fontSize: 15 }}>{g.title}</span>
                  <span className="row-meta"><AreaDots areas={g.areas} /> {g.minutes} min · {g.areas.map((a) => AREA_LABELS[a].split(' ')[0]).join(', ')}</span>
                </Link>
                {!done && (
                  <button type="button" className="icon-btn" aria-label={`Swap ${g.title} for another game`} onClick={() => swapGame(baby, today, g.id)}>
                    <Shuffle size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <Link to="/games" className="btn ghost sm" style={{ marginTop: 12, width: '100%' }}><Plus size={16} aria-hidden /> Add a game</Link>
      </section>

      <section className="card" aria-labelledby="goals-h">
        <h2 id="goals-h" className="title" style={{ marginBottom: 12 }}>Today’s goals</h2>
        <div className="goal">
          <div className="goal-row"><span className="caption">Games</span><span className="goal-value">{doneCount} <small>/ {items.length}</small></span></div>
          <ProgressBar value={doneCount} max={items.length} label="Games played today" />
        </div>
        <div className="goal">
          <div className="goal-row"><span className="caption">Play time</span><span className="goal-value">{minutes} <small>/ {dailyMinutes} min</small></span></div>
          <ProgressBar value={minutes} max={dailyMinutes} color="var(--lavender)" label="Minutes played today" />
        </div>
      </section>

      {logs.length > 0 && (
        <section className="card" aria-labelledby="timeline-h">
          <div className="card-head">
            <h2 id="timeline-h" className="title">Timeline · {logs.length} game{logs.length === 1 ? '' : 's'}</h2>
            <Link to="/progress" className="link">See all</Link>
          </div>
          <div className="list">
            {[...logs].sort((a, b) => b.createdAt - a.createdAt).map((l) => {
              const g = byId.get(l.gameId);
              const R = REACTION_META[l.reaction];
              const area = g?.areas[0] ?? 'social';
              return (
                <div key={l.id} className="row" data-area={area}>
                  <span className="row-icon"><R.icon size={20} aria-hidden /></span>
                  <div className="row-main">
                    <div className="title">{g?.title ?? 'Game'}</div>
                    <div className="row-meta">{l.minutes} min · {R.label}{l.note ? ` · ${l.note}` : ''}</div>
                  </div>
                  <span className="row-end">{new Date(l.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

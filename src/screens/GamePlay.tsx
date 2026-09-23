import { useLiveQuery } from 'dexie-react-hooks';
import { Clock, Heart, Info, Package, Pause, Play, Plus, ShieldAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AreaIcon, BackButton } from '../components/ui';
import { AREA_LABELS } from '../data/milestones';
import type { Baby, Reaction, WatchAnswer } from '../db/db';
import { db } from '../db/db';
import { addToChecklist, logGame, setSetting } from '../db/actions';
import { effectiveAgeDays } from '../domain/age';
import { gameFitsAge } from '../domain/checklist';
import type { Answer } from '../domain/milestones';
import { useGames, useSetting } from '../lib/hooks';
import { REACTION_META } from './Today';

type Phase = 'about' | 'playing' | 'log';

const ANSWERS: { value: Answer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'not_yet', label: 'Not yet' },
  { value: 'didnt_try', label: 'Didn’t try' },
];

export function GamePlay({ baby, today }: { baby: Baby; today: string }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const games = useGames();
  const favourites = useSetting<string[]>('favourites', []);
  const checklist = useLiveQuery(() => db.checklists.get([baby.id, today]), [baby.id, today]);
  const playedToday = useLiveQuery(() => db.gameLogs.where('[babyId+date]').equals([baby.id, today]).filter((l) => l.gameId === id).count(), [baby.id, today, id]);

  const [phase, setPhase] = useState<Phase>(params.get('play') ? 'playing' : 'about');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(params.get('play') === '1');
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(0);

  const [minutes, setMinutes] = useState('');
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const t = setInterval(() => setElapsed(baseRef.current + Math.floor((Date.now() - startRef.current!) / 1000)), 500);
    return () => {
      baseRef.current += Math.floor((Date.now() - startRef.current!) / 1000);
      clearInterval(t);
    };
  }, [running]);

  const game = games?.find((g) => g.id === id);
  if (!games) return <main className="screen no-tabs" aria-busy="true" />;
  if (!game) return <main className="screen no-tabs"><BackButton /><p className="empty">This game no longer exists.</p></main>;

  const isFav = favourites.includes(game.id);
  const inToday = checklist?.gameIds.includes(game.id);
  const fits = gameFitsAge(game, effectiveAgeDays(baby.dob, today, baby.gestationWeeks));
  const primary = game.areas[0];

  const finish = () => {
    setRunning(false);
    const played = Math.round(elapsed / 60);
    setMinutes(String(played >= 1 ? played : game.minutes));
    setPhase('log');
    window.scrollTo(0, 0);
  };

  const save = async () => {
    if (!reaction) return;
    setSaving(true);
    const watch: WatchAnswer[] = game.watchFor.map((w, i) => ({ milestoneId: w.milestoneId, question: w.question, answer: answers[i] ?? 'didnt_try' }));
    await logGame({ babyId: baby.id, gameId: game.id, date: today, minutes: Math.max(1, Math.round(Number(minutes) || game.minutes)), reaction, answers: watch, note: note.trim() || undefined });
    navigate('/', { replace: true });
  };

  const toggleFav = () => setSetting('favourites', isFav ? favourites.filter((f) => f !== game.id) : [...favourites, game.id]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <main className="screen no-tabs" data-area={primary}>
      <div className="split">
        <BackButton />
        <button type="button" className="icon-btn" aria-pressed={isFav} aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'} onClick={toggleFav}>
          <Heart size={18} fill={isFav ? 'var(--coral)' : 'none'} color={isFav ? 'var(--coral-text)' : 'currentColor'} />
        </button>
      </div>

      <header className="stack" style={{ gap: 8 }}>
        <div className="chips">
          {game.areas.map((a) => <span key={a} className="pill area" data-area={a}><AreaIcon area={a} size={12} /> {AREA_LABELS[a]}</span>)}
          <span className="pill subtle"><Clock size={12} aria-hidden /> {game.minutes} min</span>
          {!fits && <span className="pill yellow">For {game.fromMonths}–{game.toMonths} months</span>}
        </div>
        <h1 className="h1">{game.title}</h1>
        {phase === 'about' && <p className="muted" style={{ margin: 0 }}>{game.benefit}</p>}
      </header>

      {phase === 'about' && (
        <>
          {game.materials.length > 0 && (
            <section className="card">
              <h2 className="title" style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}><Package size={18} aria-hidden /> You’ll need</h2>
              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--ink-2)' }}>{game.materials.map((m) => <li key={m}>{m}</li>)}</ul>
            </section>
          )}
          <section className="card">
            <h2 className="title" style={{ marginBottom: 12 }}>How to play</h2>
            <ol className="steps">{game.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </section>
          {game.safety && <div className="note-box"><ShieldAlert size={18} aria-hidden style={{ flex: 'none' }} /> {game.safety}</div>}
          {game.watchFor.length > 0 && (
            <div className="note-box info"><Info size={18} aria-hidden style={{ flex: 'none' }} />
              <span>While you play, watch for: {game.watchFor.map((w) => w.question.replace(/^Did (your baby|your child) /, '').replace(/\?$/, '')).join('; ')}.</span>
            </div>
          )}
          {!!playedToday && <p className="caption" style={{ textAlign: 'center', margin: 0 }}>Played {playedToday}× today</p>}
          <div className="stack">
            <button className="btn" type="button" onClick={() => { setPhase('playing'); setRunning(true); }}><Play size={18} aria-hidden /> Start playing</button>
            {!inToday && <button className="btn ghost" type="button" onClick={() => addToChecklist(baby, today, game.id)}><Plus size={18} aria-hidden /> Add to today’s checklist</button>}
          </div>
        </>
      )}

      {phase === 'playing' && (
        <>
          <section className="card stack" style={{ alignItems: 'center', padding: 24 }}>
            <span className="label">Playing</span>
            <div className="timer" aria-live="off">{mm}:{ss}</div>
            <button type="button" className="btn ghost sm" onClick={() => setRunning((r) => !r)}>
              {running ? <><Pause size={16} aria-hidden /> Pause</> : <><Play size={16} aria-hidden /> Resume</>}
            </button>
          </section>
          <section className="card">
            <h2 className="title" style={{ marginBottom: 12 }}>Steps</h2>
            <ol className="steps">{game.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </section>
          {game.watchFor.length > 0 && (
            <section className="card stack">
              <h2 className="title">Watch for</h2>
              {game.watchFor.map((w) => <p key={w.milestoneId} style={{ margin: 0, color: 'var(--ink-2)' }}>{w.question}</p>)}
            </section>
          )}
          <button className="btn dark" type="button" onClick={finish}>We’re done</button>
        </>
      )}

      {phase === 'log' && (
        <>
          <section className="card stack">
            <h2 className="title">How did it go?</h2>
            <div className="reaction-group" role="group" aria-label="Baby’s reaction">
              {(Object.keys(REACTION_META) as Reaction[]).map((r) => {
                const M = REACTION_META[r];
                return <button key={r} type="button" className="reaction" aria-pressed={reaction === r} onClick={() => setReaction(r)}><M.icon size={24} aria-hidden />{M.label}</button>;
              })}
            </div>
          </section>

          {game.watchFor.map((w, i) => (
            <section key={w.milestoneId} className="card stack">
              <h2 className="title" style={{ fontSize: 15 }}>{w.question}</h2>
              <div className="answer-group" role="group" aria-label={w.question}>
                {ANSWERS.map((a) => (
                  <button key={a.value} type="button" className={`chip ${a.value}`} aria-pressed={answers[i] === a.value} onClick={() => setAnswers((s) => ({ ...s, [i]: a.value }))}>{a.label}</button>
                ))}
              </div>
            </section>
          ))}

          <section className="card stack">
            <label className="field">
              <span>Minutes played</span>
              <input className="input" type="number" inputMode="numeric" min={1} max={180} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </label>
            <label className="field">
              <span>Note (optional)</span>
              <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What made them smile?" maxLength={500} />
            </label>
          </section>

          <p className="caption" style={{ margin: 0, textAlign: 'center' }}>“Not yet” is completely normal. Every baby is different.</p>
          <button className="btn" type="button" disabled={!reaction || saving} onClick={save}>{reaction ? 'Save and tick off' : 'Choose how it went'}</button>
        </>
      )}
    </main>
  );
}

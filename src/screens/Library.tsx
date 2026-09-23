import { Heart, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AreaIcon, Sheet } from '../components/ui';
import { AREAS, AREA_LABELS, type Area } from '../data/milestones';
import type { Baby } from '../db/db';
import { addToChecklist, saveCustomGame } from '../db/actions';
import { effectiveAgeDays } from '../domain/age';
import { gameFitsAge } from '../domain/checklist';
import { useGames, useSetting } from '../lib/hooks';

export function Library({ baby, today }: { baby: Baby; today: string }) {
  const games = useGames();
  const favourites = useSetting<string[]>('favourites', []);
  const [params, setParams] = useSearchParams();
  const area = params.get('area') as Area | null;
  const [scope, setScope] = useState<'now' | 'all' | 'fav'>('now');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const age = effectiveAgeDays(baby.dob, today, baby.gestationWeeks);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (games ?? [])
      .filter((g) => scope !== 'now' || gameFitsAge(g, age))
      .filter((g) => scope !== 'fav' || favourites.includes(g.id))
      .filter((g) => !area || g.areas.includes(area))
      .filter((g) => !term || g.title.toLowerCase().includes(term) || g.benefit.toLowerCase().includes(term))
      .sort((a, b) => a.fromMonths - b.fromMonths || a.title.localeCompare(b.title));
  }, [games, scope, favourites, area, q, age]);

  const setArea = (a: Area | null) => {
    const next = new URLSearchParams(params);
    if (a) next.set('area', a); else next.delete('area');
    setParams(next, { replace: true });
  };

  return (
    <main className="screen">
      <header className="header">
        <div>
          <p className="eyebrow">{list.length} game{list.length === 1 ? '' : 's'}</p>
          <h1 className="h1">Games</h1>
        </div>
        <button type="button" className="icon-btn" aria-label="Create your own game" onClick={() => setCreating(true)}><Plus size={20} /></button>
      </header>

      <label className="field" style={{ position: 'relative' }}>
        <span className="visually-hidden">Search games</span>
        <Search size={18} aria-hidden style={{ position: 'absolute', left: 16, top: 16, color: 'var(--ink-muted)' }} />
        <input className="input" style={{ paddingLeft: 44 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games" type="search" />
      </label>

      <div className="segmented" role="group" aria-label="Which games">
        <button type="button" aria-pressed={scope === 'now'} onClick={() => setScope('now')}>For {baby.name.split(' ')[0]} now</button>
        <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>All ages</button>
        <button type="button" aria-pressed={scope === 'fav'} onClick={() => setScope('fav')}>Favourites</button>
      </div>

      <div className="chips scroll" role="group" aria-label="Area">
        <button type="button" className="chip" aria-pressed={!area} onClick={() => setArea(null)}>All areas</button>
        {AREAS.map((a) => (
          <button key={a} type="button" className="chip area" data-area={a} aria-pressed={area === a} onClick={() => setArea(area === a ? null : a)}>
            <AreaIcon area={a} size={16} /> {AREA_LABELS[a]}
          </button>
        ))}
      </div>

      <section className="card" aria-label="Game list">
        {list.length === 0 ? (
          <p className="empty">{scope === 'fav' ? 'Tap the heart on any game to save it here.' : 'No games match.'}</p>
        ) : (
          <div className="list">
            {list.map((g) => (
              <Link key={g.id} to={`/game/${g.id}`} className="row" data-area={g.areas[0]}>
                <span className="row-icon"><AreaIcon area={g.areas[0]} /></span>
                <div className="row-main">
                  <div className="title">{g.title}{g.isCustom ? ' · yours' : ''}</div>
                  <div className="row-meta">{g.minutes} min · {g.fromMonths}–{g.toMonths} months</div>
                </div>
                {favourites.includes(g.id) && <Heart size={16} fill="var(--coral)" color="var(--coral-text)" aria-label="Favourite" />}
              </Link>
            ))}
          </div>
        )}
      </section>

      {creating && <CustomGameSheet baby={baby} today={today} ageMonths={Math.floor(age / 30.4375)} onClose={() => setCreating(false)} />}
    </main>
  );
}

function CustomGameSheet({ baby, today, ageMonths, onClose }: { baby: Baby; today: string; ageMonths: number; onClose: () => void }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [minutes, setMinutes] = useState('5');
  const [steps, setSteps] = useState('');
  const [benefit, setBenefit] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    if (!title.trim()) return setError('Give your game a name.');
    if (areas.length === 0) return setError('Choose at least one area.');
    const id = await saveCustomGame({
      title: title.trim(),
      areas,
      minutes: Math.max(1, Math.min(60, Number(minutes) || 5)),
      fromMonths: Math.max(0, ageMonths - 1),
      toMonths: Math.min(24, ageMonths + 3),
      materials: [],
      steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
      benefit: benefit.trim() || 'A game you made up together.',
      watchFor: [],
    });
    await addToChecklist(baby, today, id);
    navigate(`/game/${id}`);
  };

  return (
    <Sheet title="Your own game" onClose={onClose}>
      <label className="field"><span>Name</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bubble chase" /></label>
      <div className="field">
        <span>Areas it helps</span>
        <div className="chips">
          {AREAS.map((a) => (
            <button key={a} type="button" className="chip area" data-area={a} aria-pressed={areas.includes(a)}
              onClick={() => setAreas((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]))}>{AREA_LABELS[a]}</button>
          ))}
        </div>
      </div>
      <label className="field"><span>Minutes</span><input className="input" type="number" inputMode="numeric" min={1} max={60} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
      <label className="field"><span>Steps (one per line)</span><textarea className="input" value={steps} onChange={(e) => setSteps(e.target.value)} /></label>
      <label className="field"><span>Why it helps (optional)</span><input className="input" value={benefit} onChange={(e) => setBenefit(e.target.value)} /></label>
      <p className="hint" style={{ margin: 0 }}>It will be suggested for {Math.max(0, ageMonths - 1)}–{Math.min(24, ageMonths + 3)} months and added to today’s checklist.</p>
      {error && <div className="banner" role="alert">{error}</div>}
      <button type="button" className="btn" onClick={save}>Save game</button>
    </Sheet>
  );
}

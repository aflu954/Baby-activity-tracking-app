import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AreaIcon, ProgressBar } from '../components/ui';
import { CHECKPOINT_MONTHS, MILESTONE_SOURCE, MILESTONES_BY_ID, type Milestone } from '../data/milestones';
import type { Baby, MilestoneLog } from '../db/db';
import { db } from '../db/db';
import { setMilestoneSeen } from '../db/actions';
import { effectiveAgeDays, formatAge } from '../domain/age';
import { currentCheckpoint, milestonesAt, unseenPastMilestones } from '../domain/milestones';
import { formatDate } from '../lib/format';

export function Moments({ baby, today }: { baby: Baby; today: string }) {
  const logs = useLiveQuery(() => db.milestoneLogs.where('babyId').equals(baby.id).toArray(), [baby.id]);
  const age = effectiveAgeDays(baby.dob, today, baby.gestationWeeks);
  const current = currentCheckpoint(age);
  const [open, setOpen] = useState<number | null>(null);

  if (!logs) return <main className="screen" aria-busy="true" />;

  const seen = new Map(logs.map((l) => [l.milestoneId, l]));
  const seenIds = new Set(seen.keys());
  const latest = [...logs].sort((a, b) => b.observedOn.localeCompare(a.observedOn))[0];
  const latestMilestone = latest && MILESTONES_BY_ID.get(latest.milestoneId);
  const currentList = milestonesAt(current);
  const reached = currentList.filter((m) => seenIds.has(m.id)).length;
  const earlier = CHECKPOINT_MONTHS.filter((m) => m < current);
  const lastPast = earlier.at(-1);
  // Only nudge about the most recent checkpoint, so a new user isn't met with a long list.
  const pastUnseen = unseenPastMilestones(age, seenIds).filter((m) => m.ageMonths === lastPast);
  const later = CHECKPOINT_MONTHS.filter((m) => m > current);

  return (
    <main className="screen">
      <header>
        <p className="eyebrow">{formatAge(baby.dob, today, baby.gestationWeeks)}</p>
        <h1 className="h1">Moments</h1>
      </header>

      {latestMilestone ? (
        <section className="moment-feature" aria-label="Latest moment">
          <span className="tile-icon"><Sparkles size={24} aria-hidden /></span>
          <div>
            <div className="title">{latestMilestone.text}</div>
            <div className="caption" style={{ color: 'var(--yellow-text)' }}>
              {formatDate(latest.observedOn, { day: 'numeric', month: 'long' })} · {latest.source === 'game' ? 'seen during a game' : 'marked by you'}
            </div>
          </div>
        </section>
      ) : (
        <section className="moment-feature">
          <span className="tile-icon"><Sparkles size={24} aria-hidden /></span>
          <div className="caption" style={{ color: 'var(--yellow-text)' }}>Play today’s games and answer the “watch for” questions — the moments you see will appear here.</div>
        </section>
      )}

      <section className="card" aria-labelledby="now-h">
        <div className="card-head">
          <div>
            <p className="label" style={{ margin: 0 }}>By {current} months</p>
            <h2 id="now-h" className="title">{reached} of {currentList.length} reached</h2>
          </div>
          <span className="pill subtle">Every baby is different</span>
        </div>
        <ProgressBar value={reached} max={currentList.length} color="var(--yellow)" label={`Milestones reached for ${current} months`} />
        <MilestoneList list={currentList} seen={seen} baby={baby} today={today} />
      </section>

      {lastPast && pastUnseen.length > 0 && (
        <button type="button" className="note-box soft" style={{ border: 0, textAlign: 'left', width: '100%' }} onClick={() => setOpen(lastPast)}>
          <span>
            {pastUnseen.length} of the {lastPast}-month milestones {pastUnseen.length === 1 ? 'isn’t' : 'aren’t'} ticked yet. Tick any you’ve already seen.
            If you haven’t seen {pastUnseen.length === 1 ? 'it' : 'some of them'}, it’s worth mentioning at your next check-up.
          </span>
        </button>
      )}

      {[...earlier].reverse().map((m) => (
        <CheckpointCard key={m} months={m} seen={seen} baby={baby} today={today} open={open === m} onToggle={() => setOpen(open === m ? null : m)} />
      ))}
      {later.slice(0, 1).map((m) => (
        <CheckpointCard key={m} months={m} seen={seen} baby={baby} today={today} open={open === m} onToggle={() => setOpen(open === m ? null : m)} upcoming />
      ))}

      <p className="footer-note">{MILESTONE_SOURCE} This is not a diagnostic tool.</p>
    </main>
  );
}

function CheckpointCard({ months, seen, baby, today, open, onToggle, upcoming }: {
  months: number; seen: Map<string, MilestoneLog>; baby: Baby; today: string; open: boolean; onToggle: () => void; upcoming?: boolean;
}) {
  const list = milestonesAt(months);
  const reached = list.filter((m) => seen.has(m.id)).length;
  return (
    <section className="card">
      <button type="button" className="row" onClick={onToggle} aria-expanded={open} style={{ padding: 0 }}>
        <div className="row-main">
          <div className="title">{upcoming ? `Coming next · ${months} months` : `${months} months`}</div>
          <div className="row-meta">{upcoming ? `${list.length} milestones to look forward to` : `${reached} of ${list.length} reached`}</div>
        </div>
        <ChevronRight size={20} aria-hidden style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .2s' }} />
      </button>
      {open && <MilestoneList list={list} seen={seen} baby={baby} today={today} />}
    </section>
  );
}

function MilestoneList({ list, seen, baby, today }: { list: Milestone[]; seen: Map<string, MilestoneLog>; baby: Baby; today: string }) {
  return (
    <div className="list" style={{ marginTop: 8 }}>
      {list.map((m) => {
        const log = seen.get(m.id);
        return (
          <div key={m.id} className="row" data-area={m.area}>
            <button type="button" className={`check${log ? ' on' : ''}`} aria-pressed={!!log} aria-label={`${log ? 'Unmark' : 'Mark'}: ${m.text}`}
              onClick={() => setMilestoneSeen(baby.id, m.id, !log, today)}>
              {log && <Check size={14} strokeWidth={3} />}
            </button>
            <div className="row-main">
              <div style={{ font: 'var(--body)', color: log ? 'var(--ink)' : 'var(--ink-2)' }}>{m.text}</div>
              {log && <div className="row-meta">Seen {formatDate(log.observedOn)}</div>}
            </div>
            <span className="row-icon" style={{ width: 32, height: 32, borderRadius: 10 }}><AreaIcon area={m.area} size={16} /></span>
          </div>
        );
      })}
    </div>
  );
}

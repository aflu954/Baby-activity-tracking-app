import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarPlus, Download, Pencil, Plus, Trash2, Upload, UserPlus } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton, Segmented, Sheet, Toggle } from '../components/ui';
import type { Baby } from '../db/db';
import { db } from '../db/db';
import { deleteBaby, exportBackup, importBackup, setSetting } from '../db/actions';
import { formatAge } from '../domain/age';
import { formatDate, initials } from '../lib/format';
import { dailyReminderIcs, downloadFile } from '../lib/ics';
import { IS_ARTIFACT } from '../lib/env';
import { useSetting, useUnits, type Units } from '../lib/hooks';
import { MILESTONE_SOURCE } from '../data/milestones';
import { BabyForm } from './BabyForm';

export function Settings({ baby, today }: { baby: Baby; today: string }) {
  const navigate = useNavigate();
  const babies = useLiveQuery(() => db.babies.toArray()) ?? [];
  const units = useUnits();
  const dailyMinutes = useSetting('dailyMinutes', 20);
  const reminderTime = useSetting<string | null>('reminderTime', null);
  const [sheet, setSheet] = useState<'edit' | 'add' | null>(null);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState<{ kind: 'restore'; file: File } | { kind: 'delete' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addToCalendar = () => {
    if (!reminderTime) return;
    downloadFile('sbaby-play-reminder.ics', dailyReminderIcs(reminderTime, baby.name, today, window.location.origin + '/'), 'text/calendar');
  };

  const exportData = async () => {
    const json = await exportBackup();
    if (!IS_ARTIFACT) {
      downloadFile(`sbaby-backup-${today}.json`, json, 'application/json');
      setMessage('Backup saved. Keep the file somewhere safe.');
      return;
    }
    try {
      await navigator.clipboard.writeText(json);
      setMessage('Backup copied. Paste it into a note or email and save it as a .json file to restore later.');
    } catch {
      setMessage('Copying isn’t allowed here. Open the app from its own website to save a backup.');
    }
  };

  const importData = async (file: File) => {
    try {
      await importBackup(await file.text());
      setMessage('Backup restored.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  const removeBaby = async () => {
    await deleteBaby(baby.id);
    navigate('/', { replace: true });
  };

  return (
    <main className="screen no-tabs">
      <BackButton to="/" />
      <h1 className="h1">Settings</h1>

      <section className="card" aria-labelledby="family-h">
        <h2 id="family-h" className="title" style={{ marginBottom: 4 }}>Family</h2>
        <div className="list">
          {babies.map((b) => (
            <div key={b.id} className="row">
              <span className="avatar sm">{initials(b.name)}</span>
              <div className="row-main">
                <div className="title">{b.name}</div>
                <div className="row-meta">Born {formatDate(b.dob, { day: 'numeric', month: 'long', year: 'numeric' })} · {formatAge(b.dob, today, b.gestationWeeks)}</div>
              </div>
              {b.id === baby.id ? (
                <button type="button" className="link" onClick={() => setSheet('edit')} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Pencil size={14} aria-hidden /> Edit</button>
              ) : (
                <button type="button" className="link" onClick={() => setSetting('activeBabyId', b.id)}>Switch</button>
              )}
            </div>
          ))}
          <button type="button" className="row" onClick={() => setSheet('add')}>
            <span className="row-icon"><Plus size={18} aria-hidden /></span>
            <div className="row-main"><div className="title">Add another baby</div></div>
          </button>
          <div className="row" aria-disabled="true">
            <span className="row-icon"><UserPlus size={18} aria-hidden /></span>
            <div className="row-main">
              <div className="title" style={{ color: 'var(--ink-muted)' }}>Invite a caregiver</div>
              <div className="row-meta">Coming soon — sharing between parents needs an account</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card stack" aria-labelledby="play-h">
        <h2 id="play-h" className="title">Daily play goal</h2>
        <Segmented<string> label="Daily play goal" value={String(dailyMinutes)} onChange={(v) => setSetting('dailyMinutes', Number(v))}
          options={[{ value: '10', label: '10 min' }, { value: '20', label: '20 min' }, { value: '30', label: '30 min' }]} />
      </section>

      <section className="card stack" aria-labelledby="rem-h">
        <div className="split">
          <div>
            <h2 id="rem-h" className="title">Play reminder</h2>
            <div className="hint">{reminderTime ? `Every day at ${reminderTime}` : 'Off'}</div>
          </div>
          <Toggle checked={!!reminderTime} onChange={(on) => setSetting('reminderTime', on ? '19:00' : null)} label="Play reminder" />
        </div>
        {reminderTime && (
          <>
            <label className="field">
              <span>Time</span>
              <input className="input" type="time" value={reminderTime} onChange={(e) => e.target.value && setSetting('reminderTime', e.target.value)} />
            </label>
            {!IS_ARTIFACT && <button type="button" className="btn ghost" onClick={addToCalendar}><CalendarPlus size={18} aria-hidden /> Add to my calendar</button>}
            <p className="hint" style={{ margin: 0 }}>
              {IS_ARTIFACT
                ? 'After this time, the app shows a banner if today’s games aren’t finished. Calendar reminders are available when the app runs from its own website.'
                : 'Websites can’t send a notification at a set time on their own, so this adds a daily event to your phone’s calendar — your calendar reminds you. The app also shows a banner after this time if today’s games aren’t finished.'}
            </p>
          </>
        )}
      </section>

      <section className="card stack" aria-labelledby="units-h">
        <h2 id="units-h" className="title">Units</h2>
        <Segmented<Units> label="Units" value={units} onChange={(v) => setSetting('units', v)}
          options={[{ value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial' }]} />
      </section>

      <section className="card stack" aria-labelledby="backup-h">
        <div>
          <h2 id="backup-h" className="title">Backup</h2>
          <p className="hint" style={{ margin: '4px 0 0' }}>Your data lives only in this browser. Clearing browser data deletes it — save a backup now and then.</p>
        </div>
        <div className="grid-2">
          <button type="button" className="btn ghost sm" style={{ width: '100%' }} onClick={exportData}><Download size={16} aria-hidden /> {IS_ARTIFACT ? 'Copy backup' : 'Save backup'}</button>
          <button type="button" className="btn ghost sm" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}><Upload size={16} aria-hidden /> Restore</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setConfirming({ kind: 'restore', file: f }); e.target.value = ''; }} />
        {message && <p className="caption" role="status" style={{ margin: 0 }}>{message}</p>}
      </section>

      <section className="card stack">
        <h2 className="title">About</h2>
        <p className="hint" style={{ margin: 0 }}>{MILESTONE_SOURCE}</p>
        <p className="hint" style={{ margin: 0 }}>Growth percentiles: WHO Child Growth Standards (2006), 0–24 months.</p>
        <p className="hint" style={{ margin: 0 }}>Play games are ideas for bonding and noticing development. They don’t diagnose anything or cause growth on their own. Talk to your doctor about any worries.</p>
      </section>

      <button type="button" className="btn ghost" onClick={() => setConfirming({ kind: 'delete' })} style={{ color: 'var(--coral-deep)' }}><Trash2 size={16} aria-hidden /> Delete {baby.name}</button>

      {confirming && (
        <Sheet title={confirming.kind === 'delete' ? `Delete ${baby.name}?` : 'Restore backup?'} onClose={() => setConfirming(null)}>
          <p className="muted" style={{ margin: 0 }}>
            {confirming.kind === 'delete'
              ? `This deletes ${baby.name} and all their games, moments and measurements from this device. It can’t be undone.`
              : 'Restoring replaces everything on this device with the backup.'}
          </p>
          <button type="button" className="btn dark" onClick={async () => {
            const c = confirming;
            setConfirming(null);
            if (c.kind === 'delete') await removeBaby(); else await importData(c.file);
          }}>{confirming.kind === 'delete' ? 'Delete' : 'Restore'}</button>
          <button type="button" className="btn ghost" onClick={() => setConfirming(null)}>Cancel</button>
        </Sheet>
      )}

      {sheet && (
        <Sheet title={sheet === 'edit' ? `Edit ${baby.name}` : 'Add a baby'} onClose={() => setSheet(null)}>
          <BabyForm baby={sheet === 'edit' ? baby : undefined} today={today} onSaved={() => setSheet(null)} />
        </Sheet>
      )}
    </main>
  );
}

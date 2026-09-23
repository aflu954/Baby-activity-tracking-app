import { useState, type FormEvent } from 'react';
import type { Baby } from '../db/db';
import { saveBaby } from '../db/actions';
import { ageInDays, MAX_AGE_DAYS } from '../domain/age';
import type { Sex } from '../domain/growth';
import { Toggle } from '../components/ui';

export function BabyForm({ baby, today, onSaved, submitLabel = 'Save' }: {
  baby?: Baby;
  today: string;
  onSaved: (baby: Baby) => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(baby?.name ?? '');
  const [dob, setDob] = useState(baby?.dob ?? '');
  const [sex, setSex] = useState<Sex | ''>(baby?.sex ?? '');
  const [early, setEarly] = useState(!!baby?.gestationWeeks && baby.gestationWeeks < 37);
  const [weeks, setWeeks] = useState(baby?.gestationWeeks ? String(baby.gestationWeeks) : '');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const age = dob ? ageInDays(dob, today) : NaN;
    const w = Number(weeks);
    if (!name.trim()) return setError('Please add your baby’s name.');
    if (!dob || Number.isNaN(age)) return setError('Please add the date of birth.');
    if (age < 0) return setError('The date of birth is in the future.');
    if (!sex) return setError('Please choose boy or girl — the WHO growth charts are different for each.');
    if (early && !(w >= 22 && w <= 36)) return setError('Weeks of pregnancy at birth should be between 22 and 36.');
    setError('');
    const saved = await saveBaby({ id: baby?.id, name: name.trim(), dob, sex, gestationWeeks: early ? w : undefined });
    onSaved(saved);
  };

  const age = dob ? ageInDays(dob, today) : 0;

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <label className="field">
        <span>Baby’s name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mila" autoComplete="off" />
      </label>
      <label className="field">
        <span>Date of birth</span>
        <input className="input" type="date" value={dob} max={today} onChange={(e) => setDob(e.target.value)} />
        {dob && age > MAX_AGE_DAYS && <span className="hint">This app is designed for 0–24 months. Games for the oldest age will still show.</span>}
      </label>
      <div className="field">
        <span>Boy or girl</span>
        <div className="chips" role="group" aria-label="Sex">
          <button type="button" className="chip" aria-pressed={sex === 'female'} onClick={() => setSex('female')}>Girl</button>
          <button type="button" className="chip" aria-pressed={sex === 'male'} onClick={() => setSex('male')}>Boy</button>
        </div>
        <span className="hint">Used only to pick the right WHO growth chart.</span>
      </div>
      <div className="split">
        <div>
          <div className="title" style={{ fontSize: 15 }}>Born early?</div>
          <div className="hint">Before 37 weeks of pregnancy</div>
        </div>
        <Toggle checked={early} onChange={setEarly} label="Born before 37 weeks" />
      </div>
      {early && (
        <label className="field">
          <span>Weeks of pregnancy at birth</span>
          <input className="input" inputMode="numeric" type="number" min={22} max={36} value={weeks} onChange={(e) => setWeeks(e.target.value)} placeholder="e.g. 34" />
          <span className="hint">Games, milestones and charts will use corrected age until 24 months.</span>
        </label>
      )}
      {error && <div className="banner" role="alert">{error}</div>}
      <button className="btn" type="submit">{submitLabel}</button>
    </form>
  );
}

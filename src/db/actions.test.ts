import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { SbabyDB } from './db';
import { ensureChecklist, exportBackup, importBackup, logGame, saveBaby, setMilestoneSeen, swapGame } from './actions';

let database: SbabyDB;
let n = 0;

beforeEach(async () => {
  database = new SbabyDB(`test-${n++}`);
  await database.open();
});

const newBaby = () => saveBaby({ name: 'Mila', dob: '2026-05-14', sex: 'female' }, database);

describe('actions', () => {
  it('creates the checklist once per day and keeps it', async () => {
    const baby = await newBaby();
    const a = await ensureChecklist(baby, '2026-09-23', database);
    const b = await ensureChecklist(baby, '2026-09-23', database);
    expect(a).toHaveLength(5);
    expect(b).toEqual(a);
  });

  it('swaps a game for a different one', async () => {
    const baby = await newBaby();
    const list = await ensureChecklist(baby, '2026-09-23', database);
    await swapGame(baby, '2026-09-23', list[0], database);
    const after = await ensureChecklist(baby, '2026-09-23', database);
    expect(after).toHaveLength(5);
    expect(after[0]).not.toBe(list[0]);
    expect(new Set(after).size).toBe(5);
  });

  it('marks a milestone from a yes answer, keeping the earliest date', async () => {
    const baby = await newBaby();
    const log = (date: string, answer: 'yes' | 'not_yet') =>
      logGame({ babyId: baby.id, gameId: 'roll-over', date, minutes: 5, reaction: 'loved',
        answers: [{ milestoneId: 'm6-motor-roll', question: 'q', answer }] }, database);
    await log('2026-09-20', 'not_yet');
    expect(await database.milestoneLogs.count()).toBe(0);
    await log('2026-09-23', 'yes');
    await log('2026-09-21', 'yes');
    await log('2026-09-25', 'yes');
    expect((await database.milestoneLogs.get([baby.id, 'm6-motor-roll']))?.observedOn).toBe('2026-09-21');
  });

  it('lets parents mark and unmark milestones by hand', async () => {
    const baby = await newBaby();
    await setMilestoneSeen(baby.id, 'm2-social-smile', true, '2026-07-01', database);
    expect(await database.milestoneLogs.count()).toBe(1);
    await setMilestoneSeen(baby.id, 'm2-social-smile', false, '2026-07-01', database);
    expect(await database.milestoneLogs.count()).toBe(0);
  });

  it('round-trips a backup', async () => {
    const baby = await newBaby();
    await ensureChecklist(baby, '2026-09-23', database);
    const json = await exportBackup(database);
    const other = new SbabyDB(`test-${n++}`);
    await importBackup(json, other);
    expect(await other.babies.get(baby.id)).toMatchObject({ name: 'Mila' });
    expect(await other.checklists.count()).toBe(1);
    await expect(importBackup('{"app":"nope"}', other)).rejects.toThrow('not a Sbaby Play backup');
  });
});

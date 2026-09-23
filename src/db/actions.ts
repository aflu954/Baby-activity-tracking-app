import { GAMES, type Game } from '../data/games';
import { addDays, effectiveAgeDays } from '../domain/age';
import { buildChecklist, gameFitsAge } from '../domain/checklist';
import { milestonesFromAnswers } from '../domain/milestones';
import { db, newId, type Baby, type CustomGame, type GameLog, type GrowthEntry, type SbabyDB } from './db';

export async function getSetting<T>(key: string, fallback: T, database: SbabyDB = db): Promise<T> {
  const row = await database.settings.get(key);
  return row === undefined ? fallback : (row.value as T);
}

export async function setSetting(key: string, value: unknown, database: SbabyDB = db) {
  await database.settings.put({ key, value });
}

export async function allGames(database: SbabyDB = db): Promise<Game[]> {
  return [...GAMES, ...(await database.customGames.toArray())];
}

async function checklistContext(baby: Baby, date: string, database: SbabyDB) {
  const [games, logs, seen] = await Promise.all([
    allGames(database),
    database.gameLogs.where('babyId').equals(baby.id).toArray(),
    database.milestoneLogs.where('babyId').equals(baby.id).toArray(),
  ]);
  return {
    ageDays: effectiveAgeDays(baby.dob, date, baby.gestationWeeks),
    games,
    lovedIds: new Set(logs.filter((l) => l.reaction === 'loved').map((l) => l.gameId)),
    seenMilestoneIds: new Set(seen.map((m) => m.milestoneId)),
  };
}

/** Returns today's checklist, creating it the first time the day is opened. */
export async function ensureChecklist(baby: Baby, date: string, database: SbabyDB = db): Promise<string[]> {
  const existing = await database.checklists.get([baby.id, date]);
  if (existing) return existing.gameIds;
  const yesterday = await database.checklists.get([baby.id, addDays(date, -1)]);
  const gameIds = buildChecklist({
    seed: `${baby.id}:${date}`,
    yesterdayIds: yesterday?.gameIds ?? [],
    ...(await checklistContext(baby, date, database)),
  });
  await database.checklists.put({ babyId: baby.id, date, gameIds });
  return gameIds;
}

/** Replaces one game in today's checklist with another suitable one. */
export async function swapGame(baby: Baby, date: string, gameId: string, database: SbabyDB = db) {
  const current = await ensureChecklist(baby, date, database);
  const ctx = await checklistContext(baby, date, database);
  const others = ctx.games.filter((g) => !current.includes(g.id));
  const [next] = buildChecklist({ ...ctx, games: others, seed: `${baby.id}:${date}:${Date.now()}`, yesterdayIds: [], count: 1 });
  if (!next) return false;
  await database.checklists.put({ babyId: baby.id, date, gameIds: current.map((id) => (id === gameId ? next : id)) });
  return true;
}

export async function addToChecklist(baby: Baby, date: string, gameId: string, database: SbabyDB = db) {
  const current = await ensureChecklist(baby, date, database);
  if (current.includes(gameId)) return;
  await database.checklists.put({ babyId: baby.id, date, gameIds: [...current, gameId] });
}

export async function removeFromChecklist(baby: Baby, date: string, gameId: string, database: SbabyDB = db) {
  const current = await ensureChecklist(baby, date, database);
  await database.checklists.put({ babyId: baby.id, date, gameIds: current.filter((id) => id !== gameId) });
}

/** Saves a played game. A "yes" answer marks its milestone as seen (earliest date wins). */
export async function logGame(entry: Omit<GameLog, 'id' | 'createdAt'>, database: SbabyDB = db): Promise<GameLog> {
  const log: GameLog = { ...entry, id: newId(), createdAt: Date.now() };
  await database.transaction('rw', database.gameLogs, database.milestoneLogs, async () => {
    await database.gameLogs.add(log);
    for (const milestoneId of milestonesFromAnswers(log.answers)) {
      const existing = await database.milestoneLogs.get([log.babyId, milestoneId]);
      if (!existing || existing.observedOn > log.date) {
        await database.milestoneLogs.put({ babyId: log.babyId, milestoneId, observedOn: log.date, source: 'game', gameLogId: log.id });
      }
    }
  });
  return log;
}

export async function setMilestoneSeen(babyId: string, milestoneId: string, seen: boolean, date: string, database: SbabyDB = db) {
  if (seen) await database.milestoneLogs.put({ babyId, milestoneId, observedOn: date, source: 'manual' });
  else await database.milestoneLogs.delete([babyId, milestoneId]);
}

export async function saveGrowth(entry: Omit<GrowthEntry, 'id'> & { id?: string }, database: SbabyDB = db) {
  await database.growth.put({ ...entry, id: entry.id ?? newId() });
}

export async function saveCustomGame(game: Omit<CustomGame, 'id' | 'isCustom'>, database: SbabyDB = db) {
  const id = `custom-${newId()}`;
  await database.customGames.put({ ...game, id, isCustom: true });
  return id;
}

export async function saveBaby(baby: Omit<Baby, 'id' | 'createdAt'> & { id?: string }, database: SbabyDB = db) {
  const existing = baby.id ? await database.babies.get(baby.id) : undefined;
  const row: Baby = { ...baby, id: baby.id ?? newId(), createdAt: existing?.createdAt ?? Date.now() };
  await database.babies.put(row);
  await setSetting('activeBabyId', row.id, database);
  return row;
}

export async function deleteBaby(babyId: string, database: SbabyDB = db) {
  await database.transaction('rw', [database.babies, database.checklists, database.gameLogs, database.milestoneLogs, database.growth, database.settings], async () => {
    await database.babies.delete(babyId);
    await database.checklists.where('babyId').equals(babyId).delete();
    await database.gameLogs.where('babyId').equals(babyId).delete();
    await database.milestoneLogs.where('babyId').equals(babyId).delete();
    await database.growth.where('babyId').equals(babyId).delete();
    const next = await database.babies.toCollection().first();
    await setSetting('activeBabyId', next?.id ?? null, database);
  });
}

export function eligibleGames(games: Game[], baby: Baby, date: string) {
  const age = effectiveAgeDays(baby.dob, date, baby.gestationWeeks);
  return games.filter((g) => gameFitsAge(g, age));
}

// ——— Backup ———

const TABLES = ['babies', 'checklists', 'gameLogs', 'milestoneLogs', 'growth', 'customGames', 'settings'] as const;

export async function exportBackup(database: SbabyDB = db): Promise<string> {
  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) data[t] = await database.table(t).toArray();
  return JSON.stringify({ app: 'sbaby-play', version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

/** Replaces all local data with the backup's contents. */
export async function importBackup(json: string, database: SbabyDB = db) {
  const parsed = JSON.parse(json);
  if (parsed?.app !== 'sbaby-play' || typeof parsed.data !== 'object') throw new Error('This is not a Sbaby Play backup file.');
  await database.transaction('rw', TABLES.map((t) => database.table(t)), async () => {
    for (const t of TABLES) {
      await database.table(t).clear();
      const rows = parsed.data[t];
      if (Array.isArray(rows)) await database.table(t).bulkPut(rows);
    }
  });
}

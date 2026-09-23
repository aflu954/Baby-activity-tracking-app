import Dexie, { type EntityTable } from 'dexie';
import type { Sex } from '../domain/growth';
import type { Answer } from '../domain/milestones';
import type { Game } from '../data/games';

export interface Baby {
  id: string;
  name: string;
  dob: string; // YYYY-MM-DD
  sex: Sex;
  gestationWeeks?: number;
  createdAt: number;
}

export interface DailyChecklist {
  babyId: string;
  date: string;
  gameIds: string[];
}

export type Reaction = 'loved' | 'okay' | 'not_interested';

export interface WatchAnswer {
  milestoneId: string;
  question: string;
  answer: Answer;
}

export interface GameLog {
  id: string;
  babyId: string;
  gameId: string;
  date: string;
  minutes: number;
  reaction: Reaction;
  answers: WatchAnswer[];
  note?: string;
  createdAt: number;
}

export interface MilestoneLog {
  babyId: string;
  milestoneId: string;
  observedOn: string;
  source: 'game' | 'manual';
  gameLogId?: string;
}

export interface GrowthEntry {
  id: string;
  babyId: string;
  date: string;
  weightKg?: number;
  lengthCm?: number;
  headCm?: number;
  where?: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

export type CustomGame = Game & { isCustom: true };

export class SbabyDB extends Dexie {
  babies!: EntityTable<Baby, 'id'>;
  checklists!: Dexie.Table<DailyChecklist, [string, string]>;
  gameLogs!: EntityTable<GameLog, 'id'>;
  milestoneLogs!: Dexie.Table<MilestoneLog, [string, string]>;
  growth!: EntityTable<GrowthEntry, 'id'>;
  customGames!: EntityTable<CustomGame, 'id'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor(name = 'sbaby') {
    super(name);
    this.version(1).stores({
      babies: 'id',
      checklists: '[babyId+date], babyId',
      gameLogs: 'id, babyId, [babyId+date], gameId',
      milestoneLogs: '[babyId+milestoneId], babyId',
      growth: 'id, babyId, [babyId+date]',
      customGames: 'id',
      settings: 'key',
    });
  }
}

export const db = new SbabyDB();

export function newId(): string {
  return crypto.randomUUID();
}

import type { Game } from '../data/games';
import { AREAS } from '../data/milestones';

const MONTH = 30.4375;

export function gameFitsAge(game: Game, ageDays: number): boolean {
  return ageDays >= Math.floor(game.fromMonths * MONTH) && ageDays <= Math.ceil(game.toMonths * MONTH);
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Small deterministic PRNG so the same baby + date always gets the same checklist. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ChecklistInput {
  seed: string;
  ageDays: number;
  games: Game[];
  yesterdayIds: string[];
  lovedIds: Set<string>;
  seenMilestoneIds: Set<string>;
  count?: number;
}

export function weightFor(game: Game, input: ChecklistInput): number {
  let w = 1;
  if (input.lovedIds.has(game.id)) w += 1.5;
  if (game.watchFor.some((q) => !input.seenMilestoneIds.has(q.milestoneId))) w += 1;
  return w;
}

/**
 * Picks today's games: at least one per area when possible, no repeats from
 * yesterday unless there aren't enough games, favouring loved games and games
 * that check milestones not yet seen.
 */
export function buildChecklist(input: ChecklistInput): string[] {
  const count = input.count ?? 5;
  const rand = mulberry32(hash(input.seed));
  const eligible = input.games.filter((g) => gameFitsAge(g, input.ageDays));
  const yesterday = new Set(input.yesterdayIds);
  const fresh = eligible.filter((g) => !yesterday.has(g.id));
  let pool = fresh.length >= count ? fresh : eligible;
  const picked: Game[] = [];

  const draw = (candidates: Game[]): Game | undefined => {
    if (candidates.length === 0) return undefined;
    const weights = candidates.map((g) => weightFor(g, input));
    let r = rand() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  };
  const take = (g: Game | undefined) => {
    if (!g) return;
    picked.push(g);
    pool = pool.filter((x) => x.id !== g.id);
  };

  // Cover the areas with the fewest games first so rare areas aren't crowded out.
  const areaOrder = [...AREAS].sort(
    (a, b) => pool.filter((g) => g.areas.includes(a)).length - pool.filter((g) => g.areas.includes(b)).length,
  );
  for (const area of areaOrder) {
    if (picked.length >= count) break;
    if (picked.some((g) => g.areas.includes(area))) continue;
    take(draw(pool.filter((g) => g.areas.includes(area))));
  }
  while (picked.length < count && pool.length > 0) take(draw(pool));
  return picked.map((g) => g.id);
}

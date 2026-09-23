import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../db/db';
import { allGames } from '../db/actions';
import { toISODate } from '../domain/age';
import type { Game } from '../data/games';

/** Today's local date; updates at midnight while the app is open. */
export function useToday(): string {
  const [today, setToday] = useState(() => toISODate(new Date()));
  useEffect(() => {
    const id = setInterval(() => {
      const now = toISODate(new Date());
      setToday((prev) => (prev === now ? prev : now));
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

export function useSetting<T>(key: string, fallback: T): T {
  return useLiveQuery(async () => {
    const row = await db.settings.get(key);
    return row === undefined ? fallback : (row.value as T);
  }, [key]) ?? fallback;
}

/** undefined while loading, null when there is no baby yet. */
export function useActiveBaby() {
  return useLiveQuery(async () => {
    const active = await db.settings.get('activeBabyId');
    const baby = active?.value ? await db.babies.get(active.value as string) : undefined;
    return baby ?? (await db.babies.orderBy('id').first()) ?? null;
  });
}

export function useGames(): Game[] | undefined {
  return useLiveQuery(() => allGames());
}

export type Units = 'metric' | 'imperial';
export const useUnits = () => useSetting<Units>('units', 'metric');

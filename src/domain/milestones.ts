import { CHECKPOINT_MONTHS, MILESTONES, type Milestone } from '../data/milestones';

const MONTH = 30.4375;

export type Answer = 'yes' | 'not_yet' | 'didnt_try';

/** The checkpoint the baby is growing towards (or 24 at the end). */
export function currentCheckpoint(ageDays: number): number {
  return CHECKPOINT_MONTHS.find((m) => ageDays < m * MONTH) ?? CHECKPOINT_MONTHS[CHECKPOINT_MONTHS.length - 1];
}

export function milestonesAt(months: number): Milestone[] {
  return MILESTONES.filter((m) => m.ageMonths === months);
}

/**
 * Milestones for checkpoints the baby has already passed that haven't been
 * marked as seen. Shown as a gentle "mention it at your next check-up" note.
 */
export function unseenPastMilestones(ageDays: number, seen: Set<string>): Milestone[] {
  return MILESTONES.filter((m) => m.ageMonths * MONTH <= ageDays && !seen.has(m.id));
}

/** Only a "yes" marks a milestone; "not yet" and "didn't try" never unmark or penalise. */
export function milestonesFromAnswers(answers: { milestoneId: string; answer: Answer }[]): string[] {
  return [...new Set(answers.filter((a) => a.answer === 'yes').map((a) => a.milestoneId))];
}

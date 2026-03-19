/**
 * Streak date logic.
 * All dates are YYYY-MM-DD strings in local time.
 */

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns true if streak is still active (last activity was today or yesterday). */
export function isStreakActive(lastDate: string | null): boolean {
  if (!lastDate) return false;
  const today = todayString();
  return lastDate === today || lastDate === yesterdayString();
}

export const STREAK_MILESTONES = [7, 30, 100, 365] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export interface StreakUpdateResult {
  newStreak: number;
  newLastDate: string;
  usedFreeze: boolean;
  /** Set when newStreak exactly equals a milestone (7, 30, 100, 365). */
  milestoneHit: StreakMilestone | null;
}

/**
 * Full streak update logic for end-of-lesson.
 *
 * Rules:
 *  - lastDate === today → already counted, no change
 *  - lastDate === yesterday → consecutive day, increment
 *  - gap > 1 day + freeze available → use freeze (don't break streak)
 *  - gap > 1 day + no freeze → reset to 1
 */
export function computeStreakUpdate(
  currentStreak: number,
  lastDate: string | null,
  freezeAvailable: boolean,
): StreakUpdateResult {
  const today = todayString();
  const yesterday = yesterdayString();

  // Already counted today — nothing changes
  if (lastDate === today) {
    return { newStreak: currentStreak, newLastDate: today, usedFreeze: false, milestoneHit: null };
  }

  let newStreak: number;
  let usedFreeze = false;

  if (lastDate === yesterday) {
    // Consecutive day
    newStreak = currentStreak + 1;
  } else if (lastDate !== null && freezeAvailable) {
    // Streak would break — use freeze
    newStreak = currentStreak; // preserve streak, don't increment
    usedFreeze = true;
  } else {
    // Streak broken (no freeze or no prior streak)
    newStreak = 1;
  }

  const milestoneHit = (STREAK_MILESTONES as readonly number[]).includes(newStreak)
    ? (newStreak as StreakMilestone)
    : null;

  return { newStreak, newLastDate: today, usedFreeze, milestoneHit };
}

/**
 * Returns true if today is Monday (used to replenish weekly streak freeze).
 */
export function isMondayToday(): boolean {
  return new Date().getDay() === 1;
}

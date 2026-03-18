/**
 * Streak date logic.
 * Dates are compared in the user's local timezone using YYYY-MM-DD strings.
 */

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Returns true if streak is still active (last activity was today or yesterday) */
export function isStreakActive(lastDate: string | null): boolean {
  if (!lastDate) return false;
  const today = todayString();
  const yesterday = yesterdayString();
  return lastDate === today || lastDate === yesterday;
}

/** Returns updated streak count given current streak and last date */
export function updateStreak(currentStreak: number, lastDate: string | null): number {
  if (!lastDate) return 1;
  const today = todayString();
  if (lastDate === today) return currentStreak; // already counted today
  if (lastDate === yesterdayString()) return currentStreak + 1;
  return 1; // streak broken
}

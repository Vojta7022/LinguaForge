import { getDB } from '@/services/database/db';
import type { UserProgress } from '@/types/progress';

export async function recordProgress(progress: UserProgress): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO user_progress
     (id, user_id, exercise_id, is_correct, answer_given, time_spent_ms, attempted_at)
     VALUES (?,?,?,?,?,?,?)`,
    [progress.id, progress.user_id, progress.exercise_id,
     progress.is_correct ? 1 : 0, progress.answer_given,
     progress.time_spent_ms, progress.attempted_at],
  );
}

export async function getProgressForUser(
  userId: string,
  limit = 100,
): Promise<UserProgress[]> {
  const db = await getDB();
  return db.getAllAsync<UserProgress>(
    'SELECT * FROM user_progress WHERE user_id = ? ORDER BY attempted_at DESC LIMIT ?',
    [userId, limit],
  );
}

export interface TypeAccuracy {
  type: string;
  correct: number;
  total: number;
  percentage: number;
}

/**
 * Returns accuracy broken down by exercise type for the given user.
 * Only includes types that have at least 1 attempt.
 */
export async function getAccuracyByType(userId: string): Promise<TypeAccuracy[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ type: string; correct: number; total: number }>(
    `SELECT e.type,
            COUNT(p.id) AS total,
            SUM(CASE WHEN p.is_correct = 1 THEN 1 ELSE 0 END) AS correct
     FROM user_progress p
     LEFT JOIN exercises e ON p.exercise_id = e.id
     WHERE p.user_id = ? AND e.type IS NOT NULL
     GROUP BY e.type
     ORDER BY total DESC`,
    [userId],
  );
  return rows.map((r) => ({
    ...r,
    percentage: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
  }));
}

export interface DayActivity {
  date: string;   // YYYY-MM-DD
  count: number;
}

/**
 * Returns daily exercise attempt counts for the past 7 days (including today).
 * Days with zero activity are included with count = 0.
 */
export async function getWeeklyActivity(userId: string): Promise<DayActivity[]> {
  const db = await getDB();

  // Build the last 7 dates in YYYY-MM-DD format
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const cutoff = days[0]; // earliest date
  const rows = await db.getAllAsync<{ date: string; count: number }>(
    `SELECT DATE(attempted_at) AS date, COUNT(*) AS count
     FROM user_progress
     WHERE user_id = ? AND DATE(attempted_at) >= ?
     GROUP BY DATE(attempted_at)`,
    [userId, cutoff],
  );

  const rowMap = new Map(rows.map((r) => [r.date, r.count]));
  return days.map((date) => ({ date, count: rowMap.get(date) ?? 0 }));
}

export interface TotalStats {
  completed: number;   // total exercise attempts
  correct: number;     // total correct attempts
  uniqueTopics: number; // unique vocab topics from correct exercises
}

/** Returns lifetime totals for the given user. */
export async function getTotalStats(userId: string): Promise<TotalStats> {
  const db = await getDB();

  const totalsRow = await db.getFirstAsync<{ completed: number; correct: number }>(
    `SELECT COUNT(*) AS completed,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct
     FROM user_progress
     WHERE user_id = ?`,
    [userId],
  );

  const topicsRow = await db.getFirstAsync<{ uniqueTopics: number }>(
    `SELECT COUNT(DISTINCT e.vocab_topic) AS uniqueTopics
     FROM user_progress p
     LEFT JOIN exercises e ON p.exercise_id = e.id
     WHERE p.user_id = ? AND p.is_correct = 1 AND e.vocab_topic IS NOT NULL`,
    [userId],
  );

  return {
    completed: totalsRow?.completed ?? 0,
    correct: totalsRow?.correct ?? 0,
    uniqueTopics: topicsRow?.uniqueTopics ?? 0,
  };
}

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

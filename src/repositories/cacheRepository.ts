import { getDB } from '@/services/database/db';
import type { Exercise } from '@/types/exercise';

export async function getCachedExercises(
  promptHash: string,
): Promise<Exercise[] | null> {
  const db = await getDB();
  const meta = await db.getFirstAsync<{ exercise_ids: string; expires_at: string }>(
    'SELECT exercise_ids, expires_at FROM exercise_cache_meta WHERE prompt_hash = ?',
    [promptHash],
  );
  if (!meta) return null;
  if (new Date(meta.expires_at) < new Date()) return null; // expired

  const ids: string[] = JSON.parse(meta.exercise_ids);
  const placeholders = ids.map(() => '?').join(',');
  return db.getAllAsync<Exercise>(
    `SELECT * FROM exercises WHERE id IN (${placeholders})`,
    ids,
  );
}

export async function storeExerciseBatch(
  promptHash: string,
  exercises: Exercise[],
  expiresInDays = 7,
): Promise<void> {
  const db = await getDB();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 86_400_000).toISOString();
  const ids = exercises.map((e) => e.id);

  await db.runAsync(
    `INSERT OR REPLACE INTO exercise_cache_meta
     (id, prompt_hash, language, level, topic, exercise_type, exercise_ids, cached_at, expires_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      Math.random().toString(36).slice(2),
      promptHash,
      exercises[0]?.language ?? '',
      exercises[0]?.level ?? '',
      exercises[0]?.vocab_topic ?? '',
      exercises[0]?.type ?? '',
      JSON.stringify(ids),
      now.toISOString(),
      expiresAt,
    ],
  );
}

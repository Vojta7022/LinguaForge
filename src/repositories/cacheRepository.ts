import { getDB } from '@/services/database/db';
import type { Exercise, ExerciseType } from '@/types/exercise';
import type { CEFRLevel, SupportedLanguage } from '@/types/user';

function parseExerciseRow(row: Record<string, unknown>): Exercise {
  return {
    ...(row as unknown as Exercise),
    content: JSON.parse(row.content as string),
    is_cached: Boolean(row.is_cached),
  };
}

/**
 * Returns a fresh (not-yet-expired) cached batch for the given prompt hash.
 * Returns null if no hit or if the batch has expired.
 */
export async function getCachedExercises(
  promptHash: string,
): Promise<Exercise[] | null> {
  const db = await getDB();

  const meta = await db.getFirstAsync<{
    exercise_ids: string;
    expires_at: string;
  }>(
    'SELECT exercise_ids, expires_at FROM exercise_cache_meta WHERE prompt_hash = ?',
    [promptHash],
  );

  if (!meta) return null;
  if (new Date(meta.expires_at) < new Date()) return null; // expired

  const ids: string[] = JSON.parse(meta.exercise_ids);
  if (ids.length === 0) return null;

  const placeholders = ids.map(() => '?').join(',');
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM exercises WHERE id IN (${placeholders})`,
    ids,
  );

  if (rows.length === 0) return null;
  return rows.map(parseExerciseRow);
}

/**
 * Records a new cache batch entry.
 * Call AFTER saveExercises() has already written the exercise rows.
 */
export async function storeExerciseBatch(
  promptHash: string,
  exercises: Exercise[],
  expiresInDays = 7,
): Promise<void> {
  if (exercises.length === 0) return;

  const db = await getDB();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + expiresInDays * 86_400_000,
  ).toISOString();
  const ids = exercises.map((e) => e.id);

  await db.runAsync(
    `INSERT OR REPLACE INTO exercise_cache_meta
     (id, prompt_hash, language, level, topic, exercise_type, exercise_ids, cached_at, expires_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      Math.random().toString(36).slice(2),
      promptHash,
      exercises[0].language,
      exercises[0].level,
      exercises[0].vocab_topic ?? '',
      exercises[0].type,
      JSON.stringify(ids),
      now.toISOString(),
      expiresAt,
    ],
  );
}

/**
 * Fallback: returns up to 10 exercises of the given type/language/level,
 * ignoring expiry. Used when both API providers fail.
 */
export async function getStaleCachedExercises(
  type: ExerciseType,
  language: SupportedLanguage,
  level: CEFRLevel,
): Promise<Exercise[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM exercises
     WHERE type = ? AND language = ? AND level = ?
     ORDER BY generated_at DESC
     LIMIT 10`,
    [type, language, level],
  );
  return rows.map(parseExerciseRow);
}

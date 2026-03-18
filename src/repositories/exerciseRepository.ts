import { getDB } from '@/services/database/db';
import type { Exercise } from '@/types/exercise';

export async function saveExercises(exercises: Exercise[]): Promise<void> {
  const db = await getDB();
  for (const ex of exercises) {
    await db.runAsync(
      `INSERT OR REPLACE INTO exercises
       (id, lesson_id, type, content, difficulty_score, language, level,
        grammar_point, vocab_topic, times_shown, times_correct, is_cached,
        ai_model_used, prompt_hash, generated_at, expires_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [ex.id, ex.lesson_id, ex.type, JSON.stringify(ex.content),
       ex.difficulty_score, ex.language, ex.level, ex.grammar_point,
       ex.vocab_topic, ex.times_shown, ex.times_correct, ex.is_cached ? 1 : 0,
       ex.ai_model_used, ex.prompt_hash, ex.generated_at, ex.expires_at],
    );
  }
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM exercises WHERE id = ?', [id],
  );
  if (!row) return null;
  return { ...row, content: JSON.parse(row.content as string) } as Exercise;
}

export async function getCachedByHash(promptHash: string): Promise<Exercise[]> {
  // TODO Phase 1: join with exercise_cache_meta
  return [];
}

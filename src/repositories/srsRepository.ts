import { getDB } from '@/services/database/db';
import type { SpacedRepetitionCard } from '@/types/srs';

export async function getDueCards(userId: string): Promise<SpacedRepetitionCard[]> {
  const db = await getDB();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return db.getAllAsync<SpacedRepetitionCard>(
    `SELECT * FROM spaced_repetition
     WHERE user_id = ? AND next_review_date <= ?
     ORDER BY next_review_date ASC`,
    [userId, today],
  );
}

export async function upsertCard(card: SpacedRepetitionCard): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO spaced_repetition
     (id, user_id, exercise_id, next_review_date, interval_days, ease_factor,
      repetitions, last_quality_rating, last_reviewed_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [card.id, card.user_id, card.exercise_id, card.next_review_date,
     card.interval_days, card.ease_factor, card.repetitions,
     card.last_quality_rating, card.last_reviewed_at, card.created_at],
  );
}

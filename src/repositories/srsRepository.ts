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

/** Insert a new SRS card for an exercise if one does not already exist. */
export async function upsertSRSCard(userId: string, exerciseId: string): Promise<void> {
  const db = await getDB();
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const next_review_date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const created_at = new Date().toISOString();
  await db.runAsync(
    `INSERT OR IGNORE INTO spaced_repetition
     (id, user_id, exercise_id, next_review_date, interval_days, ease_factor,
      repetitions, created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, userId, exerciseId, next_review_date, 1, 2.5, 0, created_at],
  );
}

/** Retrieve a single SRS card by user + exercise, or null if not enrolled. */
export async function getSRSCard(
  userId: string,
  exerciseId: string,
): Promise<SpacedRepetitionCard | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<SpacedRepetitionCard>(
    `SELECT * FROM spaced_repetition WHERE user_id = ? AND exercise_id = ?`,
    [userId, exerciseId],
  );
  return row ?? null;
}

/** Update scheduling fields on an existing SRS card after a review. */
export async function updateSRSCard(
  cardId: string,
  result: {
    next_review_date: string;
    interval_days: number;
    ease_factor: number;
    repetitions: number;
  },
): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE spaced_repetition
     SET next_review_date = ?,
         interval_days    = ?,
         ease_factor      = ?,
         repetitions      = ?,
         last_reviewed_at = ?
     WHERE id = ?`,
    [
      result.next_review_date,
      result.interval_days,
      result.ease_factor,
      result.repetitions,
      new Date().toISOString(),
      cardId,
    ],
  );
}

export interface SpacedRepetitionCard {
  id: string;
  user_id: string;
  exercise_id: string;
  next_review_date: string;    // ISO date YYYY-MM-DD
  interval_days: number;
  ease_factor: number;         // SM-2 ease factor, default 2.5
  repetitions: number;
  last_quality_rating: number; // 0-5
  last_reviewed_at: string | null;
  created_at: string;
}

/**
 * SM-2 quality rating:
 * 0 = complete blackout
 * 1 = incorrect, remembered on seeing answer
 * 2 = incorrect, but answer was close
 * 3 = correct, but required significant effort
 * 4 = correct after hesitation
 * 5 = perfect recall
 */
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2Result {
  next_interval_days: number;
  next_ease_factor: number;
  next_repetitions: number;
  next_review_date: string;    // ISO timestamp
}

import type { SpacedRepetitionCard, SM2Quality, SM2Result } from '@/types/srs';

const MIN_EASE_FACTOR = 1.3;

/**
 * SM-2 spaced repetition algorithm.
 *
 * Quality scale:
 *   0 = complete blackout
 *   1 = incorrect, remembered on seeing answer
 *   2 = incorrect, but close
 *   3 = correct, significant effort
 *   4 = correct after hesitation
 *   5 = perfect recall
 *
 * @see https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */
export function calculateNextReview(
  card: SpacedRepetitionCard,
  quality: SM2Quality,
): SM2Result {
  let { interval_days, ease_factor, repetitions } = card;

  if (quality < 3) {
    // Incorrect — reset
    repetitions = 0;
    interval_days = 1;
  } else {
    // Correct
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  }

  // Update ease factor
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ease_factor = Math.max(MIN_EASE_FACTOR, ease_factor);

  const next_review_date = addDays(new Date(), interval_days).toISOString();

  return {
    next_interval_days: interval_days,
    next_ease_factor: ease_factor,
    next_repetitions: repetitions,
    next_review_date,
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Determine SM-2 quality rating from binary correct/incorrect + response time */
export function inferQuality(isCorrect: boolean, responseTimeMs: number): SM2Quality {
  if (!isCorrect) return 1;
  if (responseTimeMs < 3000) return 5;  // very fast
  if (responseTimeMs < 7000) return 4;  // normal
  return 3;                              // slow but correct
}

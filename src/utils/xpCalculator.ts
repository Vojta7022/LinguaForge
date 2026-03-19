import type { CEFRLevel } from '@/types/user';
import { XP_BASE, XP_MULTIPLIER } from '@/types/gamification';

/**
 * XP for a single correct answer with an optional in-lesson consecutive streak.
 *
 * Formula: round((base + consecutiveCount × 5) × difficultyMultiplier)
 *
 * Examples at B2 (1.2×):
 *   1st correct:  round((10 + 0)  × 1.2) = 12 XP
 *   2nd in a row: round((10 + 5)  × 1.2) = 18 XP
 *   3rd in a row: round((10 + 10) × 1.2) = 24 XP
 */
export function calculateCorrectAnswerXP(
  consecutiveCount: number,
  level: CEFRLevel,
): number {
  const bonus = consecutiveCount * 5;
  return Math.round((XP_BASE.correct_answer + bonus) * XP_MULTIPLIER[level]);
}

/**
 * Flat XP for fixed events — no difficulty multiplier applied.
 * (Perfect lesson and daily goal are global achievements, not difficulty-scaled.)
 */
export function calculateFlatXP(type: 'perfect_lesson' | 'daily_goal'): number {
  return XP_BASE[type];
}

/**
 * Maps total lifetime XP to an in-app numeric level.
 * Each level n requires n × 100 XP to unlock.
 * Level 1 = 0–100 XP, level 2 = 101–300 XP, level 3 = 301–600 XP, …
 *
 * Returns { level, progress } where progress ∈ [0, 1).
 */
export function xpToLevel(totalXP: number): { level: number; progress: number } {
  let level = 1;
  let accumulated = 0;
  while (accumulated + level * 100 <= totalXP) {
    accumulated += level * 100;
    level++;
  }
  const levelXP = level * 100;
  const progress = (totalXP - accumulated) / levelXP;
  return { level, progress };
}

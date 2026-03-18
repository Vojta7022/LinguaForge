import type { CEFRLevel } from '@/types/user';
import { XP_BASE, XP_MULTIPLIER } from '@/types/gamification';

export function calculateXP(
  type: keyof typeof XP_BASE,
  level: CEFRLevel,
  streakBonus = 0,
): number {
  const base = XP_BASE[type];
  const multiplier = XP_MULTIPLIER[level];
  return Math.round(base * multiplier) + streakBonus;
}

export function xpToLevel(totalXP: number): { level: number; progress: number } {
  // Each numeric level needs 100 * level XP to unlock (level 1 = 100, level 2 = 200, ...)
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

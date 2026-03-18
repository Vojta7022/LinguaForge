import { CEFRLevel } from './user';

export interface XPEvent {
  type: 'correct_answer' | 'streak_bonus' | 'perfect_lesson' | 'daily_goal' | 'level_up';
  amount: number;
  multiplier: number;
  timestamp: string;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  streak_last_date: string | null; // YYYY-MM-DD
  freeze_available: boolean;
  freeze_used_this_week: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked_at: string | null;
  progress: number;            // 0–1
}

export interface DailyGoalProgress {
  goal_xp: number;
  earned_xp: number;
  is_met: boolean;
  date: string;                // YYYY-MM-DD
}

/** XP difficulty multipliers */
export const XP_MULTIPLIER: Record<CEFRLevel, number> = {
  B1: 1.0,
  B2: 1.2,
  C1: 1.5,
  C2: 2.0,
};

/** Base XP values */
export const XP_BASE = {
  correct_answer: 10,
  streak_bonus: 5,            // per consecutive correct
  perfect_lesson: 50,
  daily_goal: 25,
} as const;

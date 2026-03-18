import { create } from 'zustand';
import type { XPEvent, StreakData, DailyGoalProgress } from '@/types/gamification';
import { XP_BASE, XP_MULTIPLIER } from '@/types/gamification';
import type { CEFRLevel } from '@/types/user';

interface GamificationState {
  xpEvents: XPEvent[];
  streak: StreakData;
  dailyGoal: DailyGoalProgress;

  awardXP: (type: XPEvent['type'], level: CEFRLevel) => number;
  checkAndUpdateStreak: () => void;
  resetDailyGoal: () => void;
}

const defaultStreak: StreakData = {
  current_streak: 0,
  longest_streak: 0,
  streak_last_date: null,
  freeze_available: true,
  freeze_used_this_week: false,
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  xpEvents: [],
  streak: defaultStreak,
  dailyGoal: { goal_xp: 20, earned_xp: 0, is_met: false, date: '' },

  awardXP: (type, level) => {
    const base = XP_BASE[type as keyof typeof XP_BASE] ?? 10;
    const multiplier = XP_MULTIPLIER[level];
    const amount = Math.round(base * multiplier);

    const event: XPEvent = { type, amount, multiplier, timestamp: new Date().toISOString() };

    set((state) => ({
      xpEvents: [event, ...state.xpEvents.slice(0, 49)],
      dailyGoal: {
        ...state.dailyGoal,
        earned_xp: state.dailyGoal.earned_xp + amount,
        is_met: state.dailyGoal.earned_xp + amount >= state.dailyGoal.goal_xp,
      },
    }));

    return amount;
  },

  checkAndUpdateStreak: () => {
    // TODO: compare today's date to streak_last_date and update (Phase 1)
  },

  resetDailyGoal: () =>
    set((state) => ({
      dailyGoal: {
        ...state.dailyGoal,
        earned_xp: 0,
        is_met: false,
        date: new Date().toISOString().slice(0, 10),
      },
    })),
}));

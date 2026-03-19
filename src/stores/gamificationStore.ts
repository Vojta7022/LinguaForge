import { create } from 'zustand';
import type { XPEvent, StreakData, DailyGoalProgress } from '@/types/gamification';
import { XP_MULTIPLIER } from '@/types/gamification';
import type { CEFRLevel } from '@/types/user';
import type { User } from '@/types/user';
import {
  calculateCorrectAnswerXP,
  calculateFlatXP,
} from '@/utils/xpCalculator';
import {
  todayString,
  isMondayToday,
  computeStreakUpdate,
  type StreakMilestone,
} from '@/utils/streakManager';
import { upsertUser } from '@/repositories/userRepository';

interface GamificationState {
  xpEvents: XPEvent[];
  streak: StreakData;
  dailyGoal: DailyGoalProgress;
  /** Set to true the first time the daily goal is met today — UI shows toast. */
  dailyGoalJustMet: boolean;
  /** Set when a streak milestone is hit (7 / 30 / 100 / 365 days). */
  streakMilestone: StreakMilestone | null;

  /**
   * Award XP for a game event. Returns the XP amount awarded.
   *
   * @param consecutiveCount - for 'correct_answer' only: how many consecutive
   *   correct answers BEFORE this one in the current lesson (0 = first correct).
   */
  awardXP: (
    type: XPEvent['type'],
    level: CEFRLevel,
    consecutiveCount?: number,
  ) => number;

  /**
   * Sync goal_xp and streak from the User record (call after login / profile load).
   */
  initFromUser: (user: User) => void;

  /**
   * Full streak update after a lesson completes.
   * Reads userStore for current streak data, applies freeze logic, persists to SQLite.
   */
  checkAndUpdateStreak: (user: User) => Promise<User>;

  /** Award the flat +25 XP daily goal bonus and clear the notification flag. */
  awardDailyGoalBonus: (level: CEFRLevel) => number;

  clearMilestone: () => void;
  clearDailyGoalNotification: () => void;
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
  dailyGoalJustMet: false,
  streakMilestone: null,

  // ─── XP ─────────────────────────────────────────────────────────────

  awardXP: (type, level, consecutiveCount = 0) => {
    const today = todayString();
    const state = get();

    // Auto-reset daily goal on new day
    if (state.dailyGoal.date !== today) {
      set({
        dailyGoal: { ...state.dailyGoal, earned_xp: 0, is_met: false, date: today },
        dailyGoalJustMet: false,
      });
    }

    // Calculate amount
    let amount: number;
    if (type === 'correct_answer') {
      amount = calculateCorrectAnswerXP(consecutiveCount, level);
    } else if (type === 'perfect_lesson' || type === 'daily_goal') {
      amount = calculateFlatXP(type);
    } else {
      amount = Math.round(10 * XP_MULTIPLIER[level]); // fallback
    }

    const event: XPEvent = {
      type,
      amount,
      multiplier: type === 'correct_answer' ? XP_MULTIPLIER[level] : 1,
      timestamp: new Date().toISOString(),
    };

    set((s) => {
      const newEarned = s.dailyGoal.earned_xp + amount;
      const wasAlreadyMet = s.dailyGoal.is_met;
      const isNowMet = newEarned >= s.dailyGoal.goal_xp;

      return {
        xpEvents: [event, ...s.xpEvents.slice(0, 49)],
        dailyGoal: {
          ...s.dailyGoal,
          earned_xp: newEarned,
          is_met: isNowMet,
          date: today,
        },
        dailyGoalJustMet: !wasAlreadyMet && isNowMet,
      };
    });

    return amount;
  },

  awardDailyGoalBonus: (level) => {
    const amount = get().awardXP('daily_goal', level);
    set({ dailyGoalJustMet: false });
    return amount;
  },

  // ─── Init from persisted user profile ────────────────────────────────

  initFromUser: (user) => {
    const today = todayString();
    const state = get();

    // Replenish streak freeze on Mondays
    const shouldReplenishFreeze = isMondayToday() && state.streak.freeze_used_this_week;

    set((s) => ({
      streak: {
        ...s.streak,
        current_streak: user.streak_count,
        longest_streak: Math.max(s.streak.longest_streak, user.streak_count),
        streak_last_date: user.streak_last_date,
        freeze_available: shouldReplenishFreeze ? true : s.streak.freeze_available,
        freeze_used_this_week: shouldReplenishFreeze ? false : s.streak.freeze_used_this_week,
      },
      dailyGoal: {
        goal_xp: user.daily_goal,
        // Keep earned_xp if same day, reset if new day
        earned_xp: s.dailyGoal.date === today ? s.dailyGoal.earned_xp : 0,
        is_met: s.dailyGoal.date === today ? s.dailyGoal.is_met : false,
        date: today,
      },
    }));
  },

  // ─── Streak update (call after each lesson) ───────────────────────────

  checkAndUpdateStreak: async (user) => {
    const { streak } = get();

    const result = computeStreakUpdate(
      user.streak_count,
      user.streak_last_date,
      streak.freeze_available,
    );

    // No change needed (already counted today)
    if (result.newStreak === user.streak_count && !result.usedFreeze) {
      return user;
    }

    const updatedUser: User = {
      ...user,
      streak_count: result.newStreak,
      streak_last_date: result.newLastDate,
      updated_at: new Date().toISOString(),
    };

    set((s) => ({
      streak: {
        ...s.streak,
        current_streak: result.newStreak,
        longest_streak: Math.max(s.streak.longest_streak, result.newStreak),
        streak_last_date: result.newLastDate,
        freeze_available: result.usedFreeze ? false : s.streak.freeze_available,
        freeze_used_this_week: result.usedFreeze ? true : s.streak.freeze_used_this_week,
      },
      streakMilestone: result.milestoneHit,
    }));

    // Persist streak to SQLite
    upsertUser(updatedUser).catch((err) =>
      console.warn('[Gamification] Streak persist failed:', err),
    );

    return updatedUser;
  },

  // ─── Notification clearing ─────────────────────────────────────────────

  clearMilestone: () => set({ streakMilestone: null }),
  clearDailyGoalNotification: () => set({ dailyGoalJustMet: false }),
}));

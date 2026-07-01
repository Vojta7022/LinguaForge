import { create } from 'zustand';
import type {
  XPEvent,
  StreakData,
  DailyGoalProgress,
  HeartsState,
  DailyQuest,
  LeagueStanding,
} from '@/types/gamification';
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
  hearts: HeartsState;
  dailyQuests: DailyQuest[];
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
  loseHeart: () => HeartsState;
  refillHearts: () => void;
  recordLessonComplete: (isPerfect: boolean) => number;
  getLeagueStandings: (user: User) => LeagueStanding[];

  /** Update goal_xp in dailyGoal without resetting earned_xp. */
  reinitDailyGoal: (newGoal: number) => void;

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

const defaultQuests = (): DailyQuest[] => [
  { id: 'earn_xp', title: 'Earn 50 XP', emoji: '⭐', target: 50, progress: 0, xp_reward: 20, is_claimed: false },
  { id: 'complete_lesson', title: 'Complete 1 lesson', emoji: '📚', target: 1, progress: 0, xp_reward: 15, is_claimed: false },
  { id: 'perfect_lesson', title: 'Finish a perfect lesson', emoji: '🏆', target: 1, progress: 0, xp_reward: 30, is_claimed: false },
];

function refillHeartsIfReady(hearts: HeartsState): HeartsState {
  if (hearts.current >= hearts.max || !hearts.next_refill_at) return hearts;
  if (Date.now() < new Date(hearts.next_refill_at).getTime()) return hearts;
  return { current: hearts.max, max: hearts.max, next_refill_at: null };
}

function updateQuest(
  quests: DailyQuest[],
  id: DailyQuest['id'],
  amount: number,
): { quests: DailyQuest[]; bonus: number } {
  let bonus = 0;
  const updated = quests.map((quest) => {
    if (quest.id !== id || quest.is_claimed) return quest;
    const progress = Math.min(quest.target, quest.progress + amount);
    const completedNow = quest.progress < quest.target && progress >= quest.target;
    if (completedNow) bonus += quest.xp_reward;
    return { ...quest, progress, is_claimed: quest.is_claimed || completedNow };
  });
  return { quests: updated, bonus };
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  xpEvents: [],
  streak: defaultStreak,
  dailyGoal: { goal_xp: 20, earned_xp: 0, is_met: false, date: '' },
  hearts: { current: 5, max: 5, next_refill_at: null },
  dailyQuests: defaultQuests(),
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
        dailyQuests: defaultQuests(),
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

    let totalAwarded = amount;
    set((s) => {
      const newEarned = s.dailyGoal.earned_xp + amount;
      const wasAlreadyMet = s.dailyGoal.is_met;
      const isNowMet = newEarned >= s.dailyGoal.goal_xp;
      const questUpdate = updateQuest(s.dailyQuests, 'earn_xp', amount);
      totalAwarded += questUpdate.bonus;

      return {
        xpEvents: [event, ...s.xpEvents.slice(0, 49)],
        dailyQuests: questUpdate.quests,
        dailyGoal: {
          ...s.dailyGoal,
          earned_xp: newEarned + questUpdate.bonus,
          is_met: isNowMet,
          date: today,
        },
        dailyGoalJustMet: !wasAlreadyMet && isNowMet,
      };
    });

    return totalAwarded;
  },

  awardDailyGoalBonus: (level) => {
    const amount = get().awardXP('daily_goal', level);
    set({ dailyGoalJustMet: false });
    return amount;
  },

  loseHeart: () => {
    const hearts = refillHeartsIfReady(get().hearts);
    const current = Math.max(0, hearts.current - 1);
    const next_refill_at =
      current < hearts.max
        ? hearts.next_refill_at ?? new Date(Date.now() + 30 * 60_000).toISOString()
        : null;
    const next = { ...hearts, current, next_refill_at };
    set({ hearts: next });
    return next;
  },

  refillHearts: () => set((s) => ({ hearts: { ...s.hearts, current: s.hearts.max, next_refill_at: null } })),

  recordLessonComplete: (isPerfect) => {
    const completed = updateQuest(get().dailyQuests, 'complete_lesson', 1);
    const perfect = isPerfect ? updateQuest(completed.quests, 'perfect_lesson', 1) : { quests: completed.quests, bonus: 0 };
    const bonus = completed.bonus + perfect.bonus;
    set((s) => ({
      dailyQuests: perfect.quests,
      dailyGoal: { ...s.dailyGoal, earned_xp: s.dailyGoal.earned_xp + bonus },
    }));
    return bonus;
  },

  getLeagueStandings: (user) => {
    const names = ['Marta', 'Leo', 'Ana', 'Tom', 'Nina', 'Omar', 'Sofia', 'Jan', 'Iris'];
    const day = Number(todayString().replace(/-/g, ''));
    const rows = names.map((name, index) => ({
      name,
      xp: Math.max(0, Math.round(user.xp * (0.45 + ((day + index * 17) % 70) / 100))),
      is_user: false,
    }));
    return [...rows, { name: user.display_name || 'You', xp: user.xp, is_user: true }]
      .sort((a, b) => b.xp - a.xp);
  },

  // ─── Init from persisted user profile ────────────────────────────────

  initFromUser: (user) => {
    const today = todayString();
    const state = get();

    // Replenish streak freeze on Mondays
    const shouldReplenishFreeze = isMondayToday() && state.streak.freeze_used_this_week;

    set((s) => ({
      hearts: refillHeartsIfReady(s.hearts),
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

  // ─── Daily goal reinit ────────────────────────────────────────────────────

  reinitDailyGoal: (newGoal) =>
    set((s) => ({
      dailyGoal: { ...s.dailyGoal, goal_xp: newGoal },
    })),

  // ─── Notification clearing ─────────────────────────────────────────────

  clearMilestone: () => set({ streakMilestone: null }),
  clearDailyGoalNotification: () => set({ dailyGoalJustMet: false }),
}));

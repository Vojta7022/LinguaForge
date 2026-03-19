import { create } from 'zustand';
import type { Lesson, LessonSession, Unit } from '@/types/lesson';

interface LessonState {
  units: Unit[];
  lessons: Lesson[];
  activeSession: LessonSession | null;
  /** Lesson IDs completed this app session (persisted in SQLite in Phase 2) */
  completedLessonIds: string[];

  startSession: (lessonId: string, userId: string) => void;
  recordAnswer: (isCorrect: boolean) => void;
  addXP: (amount: number) => void;
  completeSession: () => void;
  markLessonComplete: (lessonId: string) => void;
  loadUnitsAndLessons: (language: string) => Promise<void>;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  units: [],
  lessons: [],
  activeSession: null,
  completedLessonIds: [],

  startSession: (lessonId, userId) =>
    set({
      activeSession: {
        lesson_id: lessonId,
        user_id: userId,
        started_at: new Date().toISOString(),
        completed_at: null,
        exercises_answered: 0,
        exercises_correct: 0,
        xp_earned: 0,
        is_completed: false,
        time_spent_seconds: 0,
      },
    }),

  recordAnswer: (isCorrect) =>
    set((state) => {
      if (!state.activeSession) return {};
      return {
        activeSession: {
          ...state.activeSession,
          exercises_answered: state.activeSession.exercises_answered + 1,
          exercises_correct: isCorrect
            ? state.activeSession.exercises_correct + 1
            : state.activeSession.exercises_correct,
        },
      };
    }),

  addXP: (amount) =>
    set((state) => {
      if (!state.activeSession) return {};
      return {
        activeSession: {
          ...state.activeSession,
          xp_earned: state.activeSession.xp_earned + amount,
        },
      };
    }),

  completeSession: () => {
    const { activeSession } = get();
    if (!activeSession) return;
    const startMs = new Date(activeSession.started_at).getTime();
    const timeSpentSeconds = Math.round((Date.now() - startMs) / 1000);
    set({
      activeSession: {
        ...activeSession,
        completed_at: new Date().toISOString(),
        is_completed: true,
        time_spent_seconds: timeSpentSeconds,
      },
    });
  },

  markLessonComplete: (lessonId) =>
    set((state) => ({
      completedLessonIds: state.completedLessonIds.includes(lessonId)
        ? state.completedLessonIds
        : [...state.completedLessonIds, lessonId],
    })),

  loadUnitsAndLessons: async (_language) => {
    // TODO Phase 2: load from SQLite
  },
}));

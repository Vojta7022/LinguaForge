import { create } from 'zustand';
import type { Lesson, LessonSession, Unit } from '@/types/lesson';

interface LessonState {
  units: Unit[];
  lessons: Lesson[];
  activeSession: LessonSession | null;

  startSession: (lessonId: string, userId: string) => void;
  recordAnswer: (isCorrect: boolean) => void;
  completeSession: () => void;
  loadUnitsAndLessons: (language: string) => Promise<void>;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  units: [],
  lessons: [],
  activeSession: null,

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

  completeSession: () =>
    set((state) => {
      if (!state.activeSession) return {};
      return {
        activeSession: {
          ...state.activeSession,
          completed_at: new Date().toISOString(),
          is_completed: true,
        },
      };
    }),

  loadUnitsAndLessons: async (_language) => {
    // TODO: load from SQLite (Phase 1)
  },
}));

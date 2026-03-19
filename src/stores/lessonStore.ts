import { create } from 'zustand';
import type { Lesson, LessonSession, Unit } from '@/types/lesson';
import type { LessonDefinition } from '@/utils/lessonData';

interface LessonState {
  units: Unit[];
  lessons: Lesson[];
  activeSession: LessonSession | null;
  /** Lesson IDs completed this app session (persisted in SQLite in Phase 2) */
  completedLessonIds: string[];
  /** Per-lesson accuracy percentage (0–100) keyed by lesson id */
  lessonAccuracy: Record<string, number>;
  /** AI-generated lessons appended beyond the static seed list */
  generatedLessons: LessonDefinition[];

  startSession: (lessonId: string, userId: string) => void;
  recordAnswer: (isCorrect: boolean) => void;
  addXP: (amount: number) => void;
  completeSession: () => void;
  markLessonComplete: (lessonId: string) => void;
  setLessonAccuracy: (lessonId: string, pct: number) => void;
  addGeneratedLessons: (lessons: LessonDefinition[]) => void;
  loadUnitsAndLessons: (language: string) => Promise<void>;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  units: [],
  lessons: [],
  activeSession: null,
  completedLessonIds: [],
  lessonAccuracy: {},
  generatedLessons: [],

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

  setLessonAccuracy: (lessonId, pct) =>
    set((state) => ({
      lessonAccuracy: { ...state.lessonAccuracy, [lessonId]: pct },
    })),

  addGeneratedLessons: (lessons) =>
    set((state) => {
      const existingIds = new Set([
        ...state.generatedLessons.map((l) => l.id),
      ]);
      const newOnes = lessons.filter((l) => !existingIds.has(l.id));
      return { generatedLessons: [...state.generatedLessons, ...newOnes] };
    }),

  loadUnitsAndLessons: async (_language) => {
    // TODO Phase 2: load from SQLite
  },
}));

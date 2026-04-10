import { create } from 'zustand';
import type { CourseRoadmap, LessonSession } from '@/types/lesson';

interface LessonState {
  courseRoadmap: CourseRoadmap | null;
  roadmapStatus: 'idle' | 'loading' | 'ready' | 'error';
  roadmapError: string | null;
  activeSession: LessonSession | null;
  /** Lesson IDs completed this app session (persisted in SQLite in Phase 2) */
  completedLessonIds: string[];
  /** Per-lesson accuracy percentage (0–100) keyed by lesson id */
  lessonAccuracy: Record<string, number>;

  setCourseRoadmap: (roadmap: CourseRoadmap) => void;
  setRoadmapStatus: (status: LessonState['roadmapStatus']) => void;
  setRoadmapError: (error: string | null) => void;
  startSession: (lessonId: string, userId: string) => void;
  recordAnswer: (isCorrect: boolean) => void;
  addXP: (amount: number) => void;
  completeSession: () => void;
  markLessonComplete: (lessonId: string) => void;
  setLessonAccuracy: (lessonId: string, pct: number) => void;
  loadUnitsAndLessons: (language: string) => Promise<void>;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  courseRoadmap: null,
  roadmapStatus: 'idle',
  roadmapError: null,
  activeSession: null,
  completedLessonIds: [],
  lessonAccuracy: {},

  setCourseRoadmap: (courseRoadmap) =>
    set({
      courseRoadmap,
      roadmapStatus: 'ready',
      roadmapError: null,
    }),

  setRoadmapStatus: (roadmapStatus) => set({ roadmapStatus }),

  setRoadmapError: (roadmapError) =>
    set({
      roadmapError,
      roadmapStatus: roadmapError ? 'error' : get().roadmapStatus,
    }),

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

  loadUnitsAndLessons: async (_language) => {
    // TODO Phase 2: load from SQLite
  },
}));

import { create } from 'zustand';
import type { UserProgress, TopicMastery } from '@/types/progress';
import { recordProgress } from '@/repositories/progressRepository';

interface ProgressState {
  recentProgress: UserProgress[];
  topicMastery: TopicMastery[];

  recordAttempt: (progress: Omit<UserProgress, 'id'>) => Promise<void>;
  loadTopicMastery: (userId: string, language: string) => Promise<void>;
  getWeakTopics: (threshold?: number) => TopicMastery[];
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  recentProgress: [],
  topicMastery: [],

  recordAttempt: async (progress) => {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const full: UserProgress = { ...progress, id };

    // Persist to SQLite (best-effort — don't block lesson flow on failure)
    recordProgress(full).catch((err) =>
      console.warn('[Progress] SQLite write failed:', err),
    );

    set((state) => ({
      recentProgress: [full, ...state.recentProgress.slice(0, 99)],
    }));
  },

  loadTopicMastery: async (_userId, _language) => {
    // TODO Phase 2: load from SQLite
  },

  getWeakTopics: (threshold = 0.65) =>
    get().topicMastery.filter((t) => t.accuracy < threshold),
}));

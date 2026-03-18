import { create } from 'zustand';
import type { UserProgress, TopicMastery } from '@/types/progress';

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
    // TODO: write to SQLite user_progress table (Phase 1)
    set((state) => ({
      recentProgress: [
        { ...progress, id: Math.random().toString(36).slice(2) },
        ...state.recentProgress.slice(0, 99),
      ],
    }));
  },

  loadTopicMastery: async (_userId, _language) => {
    // TODO: load from SQLite (Phase 1)
  },

  getWeakTopics: (threshold = 0.65) =>
    get().topicMastery.filter((t) => t.accuracy < threshold),
}));

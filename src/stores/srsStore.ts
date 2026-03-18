import { create } from 'zustand';
import type { SpacedRepetitionCard, SM2Quality } from '@/types/srs';

interface SRSState {
  dueCards: SpacedRepetitionCard[];
  dueCount: number;
  isLoading: boolean;

  loadDueCards: (userId: string) => Promise<void>;
  recordReview: (cardId: string, quality: SM2Quality) => Promise<void>;
}

export const useSRSStore = create<SRSState>((set, get) => ({
  dueCards: [],
  dueCount: 0,
  isLoading: false,

  loadDueCards: async (_userId) => {
    // TODO: query SQLite spaced_repetition table for next_review_date <= today (Phase 2)
    set({ isLoading: true });
    try {
      // const cards = await srsRepository.getDueCards(userId);
      // set({ dueCards: cards, dueCount: cards.length });
    } finally {
      set({ isLoading: false });
    }
  },

  recordReview: async (cardId, quality) => {
    // TODO: apply SM-2 and update SQLite (Phase 2)
    // const card = get().dueCards.find(c => c.id === cardId);
    // const result = sm2Algorithm(card, quality);
    // await srsRepository.update(cardId, result);
    set((state) => ({
      dueCards: state.dueCards.filter((c) => c.id !== cardId),
      dueCount: Math.max(0, state.dueCount - 1),
    }));
  },
}));

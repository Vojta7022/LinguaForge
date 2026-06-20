import { create } from 'zustand';
import type { SpacedRepetitionCard, SM2Quality } from '@/types/srs';
import { getDueCards, updateSRSCard } from '@/repositories/srsRepository';
import { calculateNextReview } from '@/services/srs/spacedRepetition';

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

  loadDueCards: async (userId) => {
    set({ isLoading: true });
    try {
      const cards = await getDueCards(userId);
      set({ dueCards: cards, dueCount: cards.length });
    } finally {
      set({ isLoading: false });
    }
  },

  recordReview: async (cardId, quality) => {
    const card = get().dueCards.find((c) => c.id === cardId);
    if (!card) return;
    const result = calculateNextReview(card, quality);
    await updateSRSCard(cardId, {
      next_review_date: result.next_review_date,
      interval_days: result.next_interval_days,
      ease_factor: result.next_ease_factor,
      repetitions: result.next_repetitions,
    });
    set((state) => ({
      dueCards: state.dueCards.filter((c) => c.id !== cardId),
      dueCount: Math.max(0, state.dueCount - 1),
    }));
  },
}));

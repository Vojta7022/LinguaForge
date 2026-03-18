import { create } from 'zustand';
import type { Exercise } from '@/types/exercise';

interface ExerciseState {
  queue: Exercise[];
  currentIndex: number;
  isGenerating: boolean;
  generationError: string | null;

  readonly current: Exercise | null;

  setQueue: (exercises: Exercise[]) => void;
  advance: () => void;
  reset: () => void;
  setGenerating: (loading: boolean) => void;
  setGenerationError: (error: string | null) => void;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isGenerating: false,
  generationError: null,

  get current() {
    const { queue, currentIndex } = get();
    return queue[currentIndex] ?? null;
  },

  setQueue: (exercises) => set({ queue: exercises, currentIndex: 0 }),

  advance: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.queue.length),
    })),

  reset: () => set({ queue: [], currentIndex: 0, generationError: null }),

  setGenerating: (loading) => set({ isGenerating: loading }),

  setGenerationError: (error) => set({ generationError: error }),
}));

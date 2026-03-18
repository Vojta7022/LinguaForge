import { create } from 'zustand';
import type { SupportedLanguage, CEFRLevel } from '@/types/user';

/**
 * Transient state shared across onboarding wizard screens.
 * Not persisted — lives only for the duration of onboarding.
 * Reset after completion in ready.tsx.
 */
interface OnboardingState {
  nativeLanguage: SupportedLanguage | null;
  targetLanguage: SupportedLanguage | null;
  level: CEFRLevel;
  dailyGoal: number;

  setNativeLanguage: (lang: SupportedLanguage) => void;
  setTargetLanguage: (lang: SupportedLanguage) => void;
  setLevel: (level: CEFRLevel) => void;
  setDailyGoal: (goal: number) => void;
  reset: () => void;
}

const DEFAULTS = {
  nativeLanguage: null as SupportedLanguage | null,
  targetLanguage: null as SupportedLanguage | null,
  level: 'B2' as CEFRLevel,
  dailyGoal: 20,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...DEFAULTS,
  setNativeLanguage: (lang) => set({ nativeLanguage: lang }),
  setTargetLanguage: (lang) => set({ targetLanguage: lang }),
  setLevel: (level) => set({ level }),
  setDailyGoal: (goal) => set({ dailyGoal: goal }),
  reset: () => set(DEFAULTS),
}));

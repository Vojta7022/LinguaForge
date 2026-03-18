import { create } from 'zustand';
import type { User, UserSettings, CEFRLevel, SupportedLanguage } from '@/types/user';

interface UserState {
  user: User | null;
  settings: UserSettings | null;
  isLoading: boolean;

  setUser: (user: User) => void;
  updateLevel: (level: CEFRLevel) => void;
  updateTargetLanguage: (lang: SupportedLanguage) => void;
  addXP: (amount: number) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  loadFromDB: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  settings: null,
  isLoading: false,

  setUser: (user) => set({ user }),

  updateLevel: (level) =>
    set((state) => ({
      user: state.user ? { ...state.user, current_level: level } : null,
    })),

  updateTargetLanguage: (lang) =>
    set((state) => ({
      user: state.user ? { ...state.user, target_language: lang } : null,
    })),

  addXP: (amount) =>
    set((state) => ({
      user: state.user ? { ...state.user, xp: state.user.xp + amount } : null,
    })),

  updateSettings: (partial) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...partial } : null,
    })),

  loadFromDB: async () => {
    // TODO: load user from SQLite (Phase 0)
    set({ isLoading: true });
    try {
      // const user = await userRepository.getUser();
      // set({ user });
    } finally {
      set({ isLoading: false });
    }
  },
}));

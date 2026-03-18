import { create } from 'zustand';
import type { User, UserSettings, CEFRLevel, SupportedLanguage } from '@/types/user';
import { getUser, upsertUser } from '@/repositories/userRepository';

interface UserState {
  user: User | null;
  settings: UserSettings | null;
  isLoading: boolean;

  setUser: (user: User) => void;
  updateLevel: (level: CEFRLevel) => void;
  updateTargetLanguage: (lang: SupportedLanguage) => void;
  addXP: (amount: number) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;

  /** Load user profile from SQLite for the given user id */
  loadFromDB: (userId: string) => Promise<void>;

  /** Persist current user state back to SQLite */
  saveToDB: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  settings: null,
  isLoading: false,

  setUser: (user) => set({ user }),

  updateLevel: (level) =>
    set((state) => ({
      user: state.user ? { ...state.user, current_level: level, updated_at: new Date().toISOString() } : null,
    })),

  updateTargetLanguage: (lang) =>
    set((state) => ({
      user: state.user ? { ...state.user, target_language: lang, updated_at: new Date().toISOString() } : null,
    })),

  addXP: (amount) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, xp: state.user.xp + amount, updated_at: new Date().toISOString() }
        : null,
    })),

  updateSettings: (partial) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...partial } : null,
    })),

  loadFromDB: async (userId) => {
    set({ isLoading: true });
    try {
      const user = await getUser(userId);
      if (user) set({ user });
    } finally {
      set({ isLoading: false });
    }
  },

  saveToDB: async () => {
    const { user } = get();
    if (user) await upsertUser(user);
  },
}));

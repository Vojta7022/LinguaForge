import { create } from 'zustand';

interface AuthSession {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix ms
}

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: false,
  error: null,

  signIn: async (_email, _password) => {
    // TODO: implement Supabase auth (Phase 0)
    set({ isLoading: true, error: null });
    try {
      // const { data, error } = await supabase.auth.signInWithPassword(...)
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (_email, _password, _displayName) => {
    // TODO: implement Supabase auth (Phase 0)
    set({ isLoading: true, error: null });
    try {
      // const { data, error } = await supabase.auth.signUp(...)
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    // TODO: clear supabase session + local SQLite cache
    set({ session: null });
  },

  restoreSession: async () => {
    // TODO: read session from expo-secure-store
  },

  clearError: () => set({ error: null }),
}));

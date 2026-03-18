import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/auth/supabaseClient';
import { getUser } from '@/repositories/userRepository';

interface AuthState {
  session: Session | null;
  isOnboarded: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  /**
   * Call once on app launch (in _layout.tsx).
   * Restores session from SecureStore, checks SQLite for onboarding status,
   * and subscribes to future auth events.
   */
  initialize: () => Promise<void>;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;

  /** Called by ready.tsx after user profile is saved to SQLite */
  setOnboarded: () => void;

  clearError: () => void;
}

async function checkOnboarded(userId: string): Promise<boolean> {
  try {
    const user = await getUser(userId);
    return user !== null;
  } catch {
    return false;
  }
}

function parseError(err: unknown): string {
  if (err instanceof Error) {
    // Clean up common Supabase error messages for display
    const msg = err.message;
    if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
    if (msg.includes('Email not confirmed')) return 'Please verify your email before signing in.';
    if (msg.includes('User already registered')) return 'An account with this email already exists.';
    if (msg.includes('Password should be')) return 'Password must be at least 6 characters.';
    return msg;
  }
  return 'An unexpected error occurred. Please try again.';
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isOnboarded: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    // Subscribe to future auth events (sign in, sign out, token refresh)
    supabase.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION is handled below via getSession() — skip it here
      // to avoid a redundant SQLite lookup on startup
      if (event === 'INITIAL_SESSION') return;

      const isOnboarded = session ? await checkOnboarded(session.user.id) : false;
      set({ session, isOnboarded });
    });

    // Get the persisted session from SecureStore
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isOnboarded = session ? await checkOnboarded(session.user.id) : false;
    set({ session, isOnboarded, isInitialized: true });
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const isOnboarded = data.session
        ? await checkOnboarded(data.session.user.id)
        : false;
      set({ session: data.session, isOnboarded });
    } catch (err) {
      const error = parseError(err);
      set({ error });
      throw new Error(error); // re-throw so the form knows it failed
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
        },
      });
      if (error) throw error;
      // New account: not onboarded yet regardless of session state
      set({ session: data.session ?? null, isOnboarded: false });
    } catch (err) {
      const error = parseError(err);
      set({ error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ session: null, isOnboarded: false });
    } finally {
      set({ isLoading: false });
    }
  },

  setOnboarded: () => set({ isOnboarded: true }),

  clearError: () => set({ error: null }),
}));

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/services/auth/supabaseClient';
import { getUser, migrateGuestUser } from '@/repositories/userRepository';

const GUEST_ID_KEY = 'lf_guest_id';

// Prevents onAuthStateChange from overwriting state mid-upgrade
let isUpgrading = false;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
    const msg = err.message;
    if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
    if (msg.includes('Email not confirmed')) return 'Please verify your email before signing in.';
    if (msg.includes('User already registered')) return 'An account with this email already exists.';
    if (msg.includes('Password should be')) return 'Password must be at least 6 characters.';
    return msg;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Shared post-social-auth handler: migrates guest data if applicable
 * and returns whether the user has been onboarded.
 */
async function handleSocialSession(
  session: Session | null,
  guestId: string | null,
): Promise<boolean> {
  if (!session) return false;
  if (guestId) {
    try {
      await migrateGuestUser(guestId, session.user.id, session.user.email ?? '');
      await SecureStore.deleteItemAsync(GUEST_ID_KEY);
    } catch (err) {
      console.warn('[Auth] Guest migration failed during social sign-in:', err);
    }
  }
  return checkOnboarded(session.user.id);
}

interface AuthState {
  session: Session | null;
  isGuest: boolean;
  guestId: string | null;
  isOnboarded: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  /** Upgrade a guest account to a full Supabase account, migrating all local data. */
  upgradeGuest: (email: string, password: string, displayName: string) => Promise<void>;
  /** OAuth sign-in via Google (works on iOS + Android). */
  signInWithGoogle: () => Promise<void>;
  /** Native Apple sign-in (iOS only). */
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  setOnboarded: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isGuest: false,
  guestId: null,
  isOnboarded: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (isUpgrading) return;
      const isOnboarded = session ? await checkOnboarded(session.user.id) : false;
      set({ session, isOnboarded, isGuest: false, guestId: null });
    });

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const isOnboarded = await checkOnboarded(session.user.id);
      set({ session, isOnboarded, isInitialized: true });
      return;
    }

    // No Supabase session — check for persisted guest
    const storedGuestId = await SecureStore.getItemAsync(GUEST_ID_KEY);
    if (storedGuestId) {
      const isOnboarded = await checkOnboarded(storedGuestId);
      set({ isGuest: true, guestId: storedGuestId, isOnboarded, isInitialized: true });
      return;
    }

    set({ isInitialized: true });
  },

  continueAsGuest: async () => {
    const id = generateUUID();
    await SecureStore.setItemAsync(GUEST_ID_KEY, id);
    set({ isGuest: true, guestId: id, isOnboarded: false, error: null });
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const isOnboarded = data.session ? await checkOnboarded(data.session.user.id) : false;
      set({ session: data.session, isOnboarded, isGuest: false, guestId: null });
    } catch (err) {
      const error = parseError(err);
      set({ error });
      throw new Error(error);
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
        options: { data: { display_name: displayName.trim() } },
      });
      if (error) throw error;
      set({ session: data.session ?? null, isOnboarded: false });
    } catch (err) {
      const error = parseError(err);
      set({ error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  upgradeGuest: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    isUpgrading = true;
    try {
      const { guestId } = get();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (error) throw error;

      const newId = data.user?.id;
      if (newId && guestId) {
        await migrateGuestUser(guestId, newId, email);
      }

      await SecureStore.deleteItemAsync(GUEST_ID_KEY);
      set({
        session: data.session ?? null,
        isGuest: false,
        guestId: null,
        isOnboarded: true,
      });
    } catch (err) {
      const error = parseError(err);
      set({ error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
      isUpgrading = false;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const redirectTo = makeRedirectUri({ scheme: 'linguaforge' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw error ?? new Error('Google OAuth URL unavailable');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return; // user cancelled

      // Parse access_token + refresh_token from the URL hash fragment
      const hash = result.url.split('#')[1] ?? '';
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) {
        throw new Error('Missing tokens in OAuth callback URL');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;

      const { guestId } = get();
      isUpgrading = !!guestId;
      try {
        const isOnboarded = await handleSocialSession(sessionData.session, guestId);
        set({ session: sessionData.session, isOnboarded, isGuest: false, guestId: null });
      } finally {
        isUpgrading = false;
      }
    } catch (err) {
      // Ignore user-cancelled flows
      const msg = (err as Error).message ?? '';
      if (msg.includes('ERR_CANCELED') || msg.includes('cancelled') || msg.includes('dismissed')) return;
      set({ error: parseError(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithApple: async () => {
    set({ isLoading: true, error: null });
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) throw new Error('Apple did not return an identity token');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;

      const { guestId } = get();
      isUpgrading = !!guestId;
      try {
        const isOnboarded = await handleSocialSession(data.session, guestId);
        set({ session: data.session, isOnboarded, isGuest: false, guestId: null });
      } finally {
        isUpgrading = false;
      }
    } catch (err) {
      // ERR_CANCELED = user pressed Cancel in the Apple sheet
      if ((err as { code?: string }).code === 'ERR_CANCELED') return;
      set({ error: parseError(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { isGuest } = get();
      if (isGuest) {
        await SecureStore.deleteItemAsync(GUEST_ID_KEY);
        set({ isGuest: false, guestId: null, isOnboarded: false });
      } else {
        await supabase.auth.signOut();
        set({ session: null, isOnboarded: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setOnboarded: () => set({ isOnboarded: true }),

  clearError: () => set({ error: null }),
}));

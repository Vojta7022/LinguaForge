import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { getDB } from '@/services/database/db';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useSyncStore } from '@/stores/syncStore';
import { useNetwork } from '@/hooks/useNetwork';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const { session, isGuest, guestId, isOnboarded, isInitialized, initialize } = useAuthStore();
  const { loadFromDB } = useUserStore();
  const triggerSync = useSyncStore((s) => s.triggerSync);
  const { isOnline } = useNetwork();

  // Step 1: Bootstrap — open SQLite (runs migrations) then restore auth/guest session
  useEffect(() => {
    async function bootstrap() {
      try {
        await getDB();
        await initialize();
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, []);

  // Step 2: Load user profile from SQLite — works for both Supabase and guest users
  const userId = session?.user.id ?? (isGuest ? guestId : null);
  useEffect(() => {
    if (userId) {
      loadFromDB(userId);
    }
  }, [userId]);

  // Step 3: Route based on auth + onboarding state
  useEffect(() => {
    if (!appReady || !isInitialized) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const isLoggedIn = !!session || isGuest;

    if (!isLoggedIn) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (!isOnboarded) {
      if (!inOnboarding) router.replace('/(onboarding)/welcome');
    } else {
      if (inAuth || inOnboarding) router.replace('/(tabs)');
    }
  }, [appReady, isInitialized, session, isGuest, isOnboarded, segments[0]]);

  // Step 4: Trigger sync on network reconnect (30s debounce to let connection stabilise)
  // Only fires on false→true transition; skips cold-start where prev is null
  // Only syncs for authenticated users — guests have no Supabase account
  const wasOnlineRef = useRef<boolean | null>(null);
  useEffect(() => {
    const prev = wasOnlineRef.current;
    wasOnlineRef.current = isOnline;
    if (!isOnline || !userId || isGuest || prev !== false) return;
    const timer = setTimeout(() => { triggerSync(userId); }, 30_000);
    return () => clearTimeout(timer);
  }, [isOnline, userId, isGuest, triggerSync]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="lesson/[id]"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="lesson-complete/[id]"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="srs-review"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', headerShown: false }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { getDB } from '@/services/database/db';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const { session, isOnboarded, isInitialized, initialize } = useAuthStore();
  const { loadFromDB } = useUserStore();

  // Step 1: Bootstrap — open SQLite (runs migrations) then restore auth session
  useEffect(() => {
    async function bootstrap() {
      try {
        await getDB();           // opens linguaforge.db and runs all migrations
        await initialize();      // restores Supabase session from SecureStore
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, []);

  // Step 2: Once auth is known, load user profile from SQLite
  useEffect(() => {
    if (session?.user.id) {
      loadFromDB(session.user.id);
    }
  }, [session?.user.id]);

  // Step 3: Route based on auth + onboarding state
  useEffect(() => {
    if (!appReady || !isInitialized) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!session) {
      // Not logged in
      if (!inAuth) router.replace('/(auth)/login');
    } else if (!isOnboarded) {
      // Logged in but haven't completed onboarding
      if (!inOnboarding) router.replace('/(onboarding)/welcome');
    } else {
      // Fully authenticated — boot out of auth/onboarding screens
      if (inAuth || inOnboarding) router.replace('/(tabs)');
    }
  }, [appReady, isInitialized, session, isOnboarded, segments[0]]);

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
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

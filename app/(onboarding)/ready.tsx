import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserStore } from '@/stores/userStore';
import { upsertUser } from '@/repositories/userRepository';
import type { User } from '@/types/user';

export default function ReadyScreen() {
  const { session, isGuest, guestId, setOnboarded } = useAuthStore();
  const { nativeLanguage, targetLanguage, level, dailyGoal, reset } = useOnboardingStore();
  const { setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Works for both Supabase users (session.user.id) and guests (guestId)
  const userId = session?.user.id ?? (isGuest ? guestId : null);

  async function handleStart() {
    if (!userId || !nativeLanguage || !targetLanguage) return;

    setIsLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const user: User = {
        id: userId,
        email: session?.user.email ?? '',
        display_name:
          session?.user.user_metadata?.display_name ??
          (isGuest ? 'Learner' : session?.user.email ?? 'Learner'),
        native_language: nativeLanguage,
        target_language: targetLanguage,
        current_level: level,
        xp: 0,
        streak_count: 0,
        streak_last_date: null,
        daily_goal: dailyGoal,
        created_at: now,
        updated_at: now,
      };

      await upsertUser(user);
      setUser(user);
      setOnboarded();
      reset();

      router.replace('/(tabs)');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-6xl mb-6">🚀</Text>
      <Text className="text-3xl font-bold text-slate-800 text-center mb-4">You're all set!</Text>
      <Text className="text-base text-slate-500 text-center mb-12">
        Your AI-powered language journey begins now. Let's forge your language skills.
      </Text>

      {error ? (
        <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 w-full">
          <Text className="text-red-600 text-sm text-center">{error}</Text>
        </View>
      ) : null}

      <Pressable
        className={`rounded-2xl px-8 py-4 w-full items-center justify-center flex-row gap-2
          ${isLoading ? 'bg-primary-600 opacity-70' : 'bg-primary-600 active:opacity-80'}`}
        onPress={handleStart}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator size="small" color="white" /> : null}
        <Text className="text-white font-bold text-lg">
          {isLoading ? 'Setting up…' : 'Start Learning'}
        </Text>
      </Pressable>
    </View>
  );
}

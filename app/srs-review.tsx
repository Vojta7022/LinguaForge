import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { useSRSStore } from '@/stores/srsStore';
import { useUserStore } from '@/stores/userStore';
import { getExercisesByIds } from '@/repositories/exerciseRepository';
import { inferQuality } from '@/services/srs/spacedRepetition';
import ExerciseShell from '@/components/exercises/ExerciseShell';
import type { Exercise } from '@/types/exercise';
import type { SpacedRepetitionCard } from '@/types/srs';

interface SessionResults {
  correct: number;
  total: number;
}

export default function SRSReviewScreen() {
  const dueCards = useSRSStore((s) => s.dueCards);
  const recordReview = useSRSStore((s) => s.recordReview);
  const user = useUserStore((s) => s.user);

  const [cards] = useState<SpacedRepetitionCard[]>(() => dueCards);
  const [exerciseMap, setExerciseMap] = useState<Map<string, Exercise>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResults>({ correct: 0, total: 0 });
  const [isDone, setIsDone] = useState(false);

  // Fetch all exercises for due cards on mount
  useEffect(() => {
    if (cards.length === 0) {
      setIsLoading(false);
      return;
    }
    const ids = cards.map((c) => c.exercise_id);
    getExercisesByIds(ids)
      .then((exercises) => {
        const map = new Map(exercises.map((e) => [e.id, e]));
        setExerciseMap(map);
      })
      .catch(() => router.back())
      .finally(() => setIsLoading(false));
  }, []);

  function handleContinue(isCorrect: boolean, _answer: string, timeMs: number) {
    const card = cards[currentIndex];
    if (!card) return;

    const quality = inferQuality(isCorrect, timeMs);
    void recordReview(card.id, quality);

    setSessionResults((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    const nextIndex = currentIndex + 1;
    if (nextIndex < cards.length) {
      setCurrentIndex(nextIndex);
    } else {
      setIsDone(true);
    }
  }

  function handleClose() {
    router.back();
  }

  // Empty state
  if (!isLoading && cards.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-5xl mb-4">📭</Text>
        <Text className="text-xl font-bold text-slate-800 mb-2">Nothing due</Text>
        <Text className="text-slate-500 text-sm text-center mb-8">
          All caught up! Come back tomorrow for your next review session.
        </Text>
        <Pressable
          className="bg-primary-600 rounded-xl px-6 py-3 active:opacity-80"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  // Summary screen
  if (isDone) {
    const { correct, total } = sessionResults;
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-6xl mb-4">🎉</Text>
        <Text className="text-2xl font-bold text-slate-800 mb-2">Review Complete</Text>
        <Text className="text-4xl font-bold text-primary-600 mb-2">
          {correct} / {total}
        </Text>
        <Text className="text-slate-500 text-base mb-1">correct</Text>
        <Text className="text-slate-400 text-sm text-center mt-4 mb-10">
          Well done! Come back tomorrow for the next batch.
        </Text>
        <Pressable
          className="bg-primary-600 rounded-xl px-8 py-4 active:opacity-80"
          onPress={() => router.replace('/(tabs)')}
        >
          <Text className="text-white font-bold text-base">Continue</Text>
        </Pressable>
      </View>
    );
  }

  // Exercise session
  const currentCard = cards[currentIndex];
  const exercise = currentCard ? exerciseMap.get(currentCard.exercise_id) : undefined;

  if (!exercise || !user) {
    // Card exists but exercise was not found in DB — skip it
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return (
    <ExerciseShell
      exercise={exercise}
      currentIndex={currentIndex}
      totalCount={cards.length}
      targetLanguage={user.target_language}
      nativeLanguage={user.native_language}
      onContinue={handleContinue}
      onClose={handleClose}
    />
  );
}

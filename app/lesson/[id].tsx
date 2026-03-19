import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useCallback, useRef, useState } from 'react';

import ExerciseShell from '@/components/exercises/ExerciseShell';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useLessonStore } from '@/stores/lessonStore';
import { useProgressStore } from '@/stores/progressStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useUserStore } from '@/stores/userStore';
import { generateExerciseBatch } from '@/services/ai/exerciseGenerator';
import { shuffle } from '@/utils/exerciseHelpers';
import { getLessonById } from '@/utils/lessonData';
import type { Exercise } from '@/types/exercise';

const EXERCISES_PER_TYPE = 4;

function interleave(arrays: Exercise[][]): Exercise[] {
  const result: Exercise[] = [];
  const maxLen = Math.max(...arrays.map((a) => a.length));
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (arr[i]) result.push(arr[i]);
    }
  }
  return result;
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useUserStore((s) => s.user);
  const lessonDef = getLessonById(id, user?.current_level);
  const effectiveLevel = lessonDef.levelOverride ?? user?.current_level ?? 'B2';

  const { queue, currentIndex, isGenerating, generationError,
    setQueue, advance, setGenerating, setGenerationError } = useExerciseStore();
  const lessonStore = useLessonStore();
  const progressStore = useProgressStore();
  const gamification = useGamificationStore();

  // Consecutive correct streak within this lesson
  const consecutiveCorrectRef = useRef(0);
  const [, forceRender] = useState(0); // unused, just to remind: no re-render needed for ref

  useEffect(() => {
    if (!user) return;
    setGenerating(true);
    setGenerationError(null);
    consecutiveCorrectRef.current = 0;

    Promise.allSettled([
      generateExerciseBatch('FILL_BLANK', user.target_language, user.native_language, effectiveLevel, lessonDef.topic),
      generateExerciseBatch('MULTIPLE_CHOICE', user.target_language, user.native_language, effectiveLevel, lessonDef.topic),
      generateExerciseBatch('TRANSLATE', user.target_language, user.native_language, effectiveLevel, lessonDef.topic),
    ]).then((results) => {
      const batches = results
        .filter((r): r is PromiseFulfilledResult<Exercise[]> => r.status === 'fulfilled')
        .map((r) => shuffle(r.value).slice(0, EXERCISES_PER_TYPE));

      if (batches.length === 0) {
        setGenerationError('Could not load exercises. Check your API keys and internet connection.');
        return;
      }

      setQueue(interleave(batches));
      lessonStore.startSession(id, user.id);
    }).finally(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = useCallback((isCorrect: boolean, answer: string, timeMs: number) => {
    if (!user) return;
    const exercise = queue[currentIndex];
    if (!exercise) return;

    // Record progress to SQLite
    progressStore.recordAttempt({
      user_id: user.id,
      exercise_id: exercise.id,
      is_correct: isCorrect,
      answer_given: answer,
      time_spent_ms: timeMs,
      attempted_at: new Date().toISOString(),
    });

    // Update lesson session + award XP
    lessonStore.recordAnswer(isCorrect);

    if (isCorrect) {
      const xp = gamification.awardXP('correct_answer', effectiveLevel, consecutiveCorrectRef.current);
      lessonStore.addXP(xp);
      consecutiveCorrectRef.current += 1;
    } else {
      consecutiveCorrectRef.current = 0;
    }

    // Advance or finish
    if (currentIndex >= queue.length - 1) {
      lessonStore.completeSession();
      router.replace(`/lesson-complete/${id}`);
    } else {
      advance();
    }
  }, [user, queue, currentIndex, effectiveLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ─────────────────────────────────────────────────────────
  if (isGenerating || (!queue.length && !generationError)) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <ActivityIndicator size="large" color="#0D9488" />
        <Text className="text-slate-600 font-semibold text-lg mt-4">{lessonDef.title}</Text>
        <Text className="text-slate-400 text-sm mt-1">Generating exercises…</Text>
        {lessonDef.levelOverride ? (
          <Text className="text-amber-500 text-xs font-semibold mt-2">
            ⚡ Challenge mode — {lessonDef.levelOverride}
          </Text>
        ) : null}
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────
  if (generationError) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-4xl mb-4">⚠️</Text>
        <Text className="text-slate-800 font-bold text-xl text-center mb-2">Couldn't load exercises</Text>
        <Text className="text-slate-500 text-sm text-center mb-8">{generationError}</Text>
        <Pressable className="bg-primary-600 rounded-2xl px-8 py-4" onPress={() => router.back()}>
          <Text className="text-white font-bold text-base">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const exercise = queue[currentIndex];
  if (!exercise) return null;

  return (
    <ExerciseShell
      key={exercise.id}
      exercise={exercise}
      currentIndex={currentIndex}
      totalCount={queue.length}
      targetLanguage={user?.target_language ?? 'en'}
      onContinue={handleContinue}
      onClose={() => router.back()}
    />
  );
}

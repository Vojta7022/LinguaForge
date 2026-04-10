import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useCallback, useMemo, useRef } from 'react';

import ExerciseShell from '@/components/exercises/ExerciseShell';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useLessonStore } from '@/stores/lessonStore';
import { useProgressStore } from '@/stores/progressStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useUserStore } from '@/stores/userStore';
import { generateLessonExercises } from '@/services/ai/exerciseGenerator';
import { buildFallbackRoadmap, getLessonById } from '@/utils/lessonData';

const EMPTY_LESSONS: ReturnType<typeof buildFallbackRoadmap>['lessons'] = [];

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useUserStore((s) => s.user);
  const addXP = useUserStore((s) => s.addXP);
  const saveToDB = useUserStore((s) => s.saveToDB);
  const courseRoadmap = useLessonStore((s) => s.courseRoadmap);
  const roadmapLessons = courseRoadmap?.lessons ?? EMPTY_LESSONS;
  const fallbackLessons = useMemo(() => user
    ? buildFallbackRoadmap(user.target_language, user.native_language, user.current_level).lessons
    : EMPTY_LESSONS,
  [user]);
  const lessonPool = roadmapLessons.length > 0 ? roadmapLessons : fallbackLessons;
  const lessonDef = getLessonById(id, user?.current_level, lessonPool);
  const effectiveLevel = lessonDef.levelOverride ?? user?.current_level ?? 'B2';
  const lessonSignature = [
    lessonDef.id,
    lessonDef.topic,
    lessonDef.lessonKind,
    lessonDef.skillType,
    lessonDef.grammarFocus.join('|'),
    lessonDef.vocabularyFocus.join('|'),
    effectiveLevel,
  ].join(':');

  const { queue, currentIndex, isGenerating, generationError,
    setQueue, advance, reset, setGenerating, setGenerationError } = useExerciseStore();
  const startSession = useLessonStore((s) => s.startSession);
  const recordLessonAnswer = useLessonStore((s) => s.recordAnswer);
  const addLessonXP = useLessonStore((s) => s.addXP);
  const completeSession = useLessonStore((s) => s.completeSession);
  const markLessonComplete = useLessonStore((s) => s.markLessonComplete);
  const setLessonAccuracy = useLessonStore((s) => s.setLessonAccuracy);
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const awardXP = useGamificationStore((s) => s.awardXP);

  const consecutiveCorrectRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    reset();
    setGenerating(true);
    setGenerationError(null);
    consecutiveCorrectRef.current = 0;

    generateLessonExercises(
      lessonDef,
      user.target_language,
      user.native_language,
      effectiveLevel,
    ).then((exercises) => {
      if (cancelled) return;
      setQueue(exercises);
      startSession(id, user.id);
    }).catch((err) => {
      if (cancelled) return;
      setGenerationError(
        (err as Error).message || 'Could not generate this lesson right now.',
      );
    }).finally(() => {
      if (!cancelled) setGenerating(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    user,
    id,
    effectiveLevel,
    lessonSignature,
    reset,
    setGenerating,
    setGenerationError,
    setQueue,
    startSession,
  ]);

  const handleContinue = useCallback((isCorrect: boolean, answer: string, timeMs: number) => {
    if (!user) return;
    const exercise = queue[currentIndex];
    if (!exercise) return;

    recordAttempt({
      user_id: user.id,
      exercise_id: exercise.id,
      is_correct: isCorrect,
      answer_given: answer,
      time_spent_ms: timeMs,
      attempted_at: new Date().toISOString(),
    });

    recordLessonAnswer(isCorrect);

    if (isCorrect) {
      const xp = awardXP('correct_answer', effectiveLevel, consecutiveCorrectRef.current);
      addLessonXP(xp);
      addXP(xp);
      consecutiveCorrectRef.current += 1;
    } else {
      consecutiveCorrectRef.current = 0;
    }

    if (currentIndex >= queue.length - 1) {
      // Compute accuracy from session state (recordAnswer was already called above)
      const finalSession = useLessonStore.getState().activeSession;
      if (finalSession && finalSession.exercises_answered > 0) {
        const pct = Math.round(
          (finalSession.exercises_correct / finalSession.exercises_answered) * 100,
        );
        setLessonAccuracy(id, pct);
      }

      completeSession();
      markLessonComplete(id);
      saveToDB().catch((err) => console.warn('[Lesson] saveToDB failed:', err));
      router.replace(`/lesson-complete/${id}`);
    } else {
      advance();
    }
  }, [
    user,
    queue,
    currentIndex,
    effectiveLevel,
    recordAttempt,
    recordLessonAnswer,
    awardXP,
    addLessonXP,
    addXP,
    setLessonAccuracy,
    completeSession,
    markLessonComplete,
    saveToDB,
    advance,
    id,
  ]);

  // ── Loading ─────────────────────────────────────────────────────────
  if (isGenerating || (!queue.length && !generationError)) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <ActivityIndicator size="large" color="#0D9488" />
        <Text className="text-slate-600 font-semibold text-lg mt-4">{lessonDef.title}</Text>
        <Text className="text-slate-400 text-sm mt-1">{lessonDef.focusLabel} lesson</Text>
        <Text className="text-slate-400 text-sm mt-2 text-center leading-5">
          {lessonDef.objective}
        </Text>
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
      targetLanguage={user?.target_language ?? 'es'}
      nativeLanguage={user?.native_language ?? 'en'}
      onContinue={handleContinue}
      onClose={() => router.back()}
    />
  );
}

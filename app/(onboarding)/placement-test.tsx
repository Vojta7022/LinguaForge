import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';

import { useOnboardingStore } from '@/stores/onboardingStore';
import { generateExerciseBatch } from '@/services/ai/exerciseGenerator';
import FillBlankExercise from '@/components/exercises/FillBlankExercise';
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise';
import { isAnswerCorrect } from '@/utils/exerciseHelpers';

import type { Exercise, FillBlankContent, MultipleChoiceContent } from '@/types/exercise';
import type { CEFRLevel } from '@/types/user';

const LEVELS: CEFRLevel[] = ['B1', 'B2', 'C1', 'C2'];
const PER_LEVEL = 3;

// Alternate types per level for variety
const TYPE_FOR_LEVEL = {
  B1: 'FILL_BLANK',
  B2: 'MULTIPLE_CHOICE',
  C1: 'FILL_BLANK',
  C2: 'MULTIPLE_CHOICE',
} as const;

const LEVEL_DESCRIPTIONS: Record<CEFRLevel, string> = {
  B1: "Intermediate — you know the essentials. There's solid room to grow.",
  B2: 'Upper-Intermediate — strong foundations with some gaps to fill.',
  C1: 'Advanced — confident command with nuanced areas to master.',
  C2: 'Mastery — near-native proficiency. A true language expert!',
};

interface Tagged {
  exercise: Exercise;
  level: CEFRLevel;
}

/** Returns the highest level where the learner got ≥ 2 out of 3 correct. */
function calculateLevel(results: Map<CEFRLevel, { correct: number; total: number }>): CEFRLevel {
  for (const level of (['C2', 'C1', 'B2', 'B1'] as CEFRLevel[])) {
    const r = results.get(level);
    if (r && r.total > 0 && r.correct / r.total >= 0.6) return level;
  }
  return 'B1';
}

export default function PlacementTestScreen() {
  const { nativeLanguage, targetLanguage, setLevel } = useOnboardingStore();

  const [exercises, setExercises] = useState<Tagged[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const resultsRef = useRef(
    new Map<CEFRLevel, { correct: number; total: number }>(
      LEVELS.map((l) => [l, { correct: 0, total: 0 }]),
    ),
  );

  const [isDone, setIsDone] = useState(false);
  const [resultLevel, setResultLevel] = useState<CEFRLevel>('B2');

  useEffect(() => {
    if (!nativeLanguage || !targetLanguage) return;

    Promise.allSettled(
      LEVELS.map((level) =>
        generateExerciseBatch(
          TYPE_FOR_LEVEL[level],
          targetLanguage,
          nativeLanguage,
          level,
          'general language proficiency',
          6,
        ),
      ),
    ).then((results) => {
      const perLevel = new Map<CEFRLevel, Exercise[]>();
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          perLevel.set(LEVELS[i], r.value.slice(0, PER_LEVEL));
        }
      });

      // Interleave: B1[0], B2[0], C1[0], C2[0], B1[1], ...
      const interleaved: Tagged[] = [];
      for (let i = 0; i < PER_LEVEL; i++) {
        for (const level of LEVELS) {
          const arr = perLevel.get(level) ?? [];
          if (arr[i]) interleaved.push({ exercise: arr[i], level });
        }
      }

      if (interleaved.length === 0) {
        setLoadError('Could not generate placement test. Check your internet connection.');
      } else {
        setExercises(interleaved);
      }
      setIsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCheck() {
    if (!selectedAnswer || !exercises[currentIndex]) return;
    const { exercise, level } = exercises[currentIndex];
    const correct = isAnswerCorrect(exercise, selectedAnswer);
    setIsCorrect(correct);
    setIsChecked(true);

    const r = resultsRef.current.get(level)!;
    resultsRef.current.set(level, {
      correct: r.correct + (correct ? 1 : 0),
      total: r.total + 1,
    });
  }

  function handleNext() {
    const next = currentIndex + 1;
    if (next >= exercises.length) {
      const level = calculateLevel(resultsRef.current);
      setResultLevel(level);
      setLevel(level);
      setIsDone(true);
    } else {
      setCurrentIndex(next);
      setSelectedAnswer(null);
      setIsChecked(false);
    }
  }

  function skipTest() {
    // Default to B2 and move on
    router.push('/(onboarding)/daily-goal');
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <ActivityIndicator size="large" color="#0D9488" />
        <Text className="text-slate-600 font-semibold text-lg mt-4">Building your placement test…</Text>
        <Text className="text-slate-400 text-sm mt-1">AI generating 12 adaptive questions</Text>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-5xl mb-4">⚠️</Text>
        <Text className="text-slate-800 font-bold text-xl text-center mb-2">Couldn't load test</Text>
        <Text className="text-slate-500 text-sm text-center mb-8 leading-6">{loadError}</Text>
        <Pressable
          className="bg-primary-600 rounded-2xl px-8 py-4 w-full items-center active:opacity-80"
          onPress={skipTest}
        >
          <Text className="text-white font-bold text-lg">Skip — start at B2</Text>
        </Pressable>
      </View>
    );
  }

  // ── Result screen ──────────────────────────────────────────────────────
  if (isDone) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-6xl mb-4">🎯</Text>
        <View className="bg-primary-50 border border-primary-200 rounded-2xl px-8 py-4 mb-6">
          <Text className="text-primary-700 font-extrabold text-4xl text-center">{resultLevel}</Text>
        </View>
        <Text className="text-2xl font-bold text-slate-800 text-center mb-3">Your CEFR level</Text>
        <Text className="text-base text-slate-500 text-center mb-10 leading-6">
          {LEVEL_DESCRIPTIONS[resultLevel]}
        </Text>
        <Pressable
          className="bg-primary-600 rounded-2xl px-8 py-4 w-full items-center active:opacity-80"
          onPress={() => router.push('/(onboarding)/daily-goal')}
        >
          <Text className="text-white font-bold text-lg">Set my daily goal →</Text>
        </Pressable>
      </View>
    );
  }

  // ── Exercise screen ────────────────────────────────────────────────────
  const { exercise } = exercises[currentIndex];
  const progress = (currentIndex + 1) / exercises.length;
  const isLast = currentIndex + 1 === exercises.length;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-14 pb-3">
        <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <View
            className="h-full bg-primary-500 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={skipTest} hitSlop={12}>
            <Text className="text-slate-400 text-sm">Skip test</Text>
          </Pressable>
          <Text className="text-slate-600 text-sm font-semibold">
            Question {currentIndex + 1} of {exercises.length}
          </Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      {/* Scrollable exercise content */}
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-3">
          {exercise.type === 'FILL_BLANK' ? (
            <FillBlankExercise
              content={exercise.content as FillBlankContent}
              selectedAnswer={selectedAnswer}
              onAnswerChange={setSelectedAnswer}
              isChecked={isChecked}
            />
          ) : (
            <MultipleChoiceExercise
              content={exercise.content as MultipleChoiceContent}
              selectedAnswer={selectedAnswer}
              onAnswerChange={setSelectedAnswer}
              isChecked={isChecked}
            />
          )}
        </View>
      </ScrollView>

      {/* Bottom action area */}
      <View className="absolute bottom-0 left-0 right-0">
        {!isChecked ? (
          <View className="px-5 pb-10 pt-3 bg-white border-t border-slate-100">
            <Pressable
              className={`rounded-2xl py-4 items-center
                ${selectedAnswer ? 'bg-primary-600 active:opacity-80' : 'bg-slate-200'}`}
              onPress={handleCheck}
              disabled={!selectedAnswer}
            >
              <Text className={`font-bold text-lg ${selectedAnswer ? 'text-white' : 'text-slate-400'}`}>
                Check
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            className={`px-5 pt-4 pb-10 border-t-2
              ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
          >
            <Text className={`text-lg font-bold mb-3 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
              {isCorrect ? '✓ Correct!' : '✗ Not quite'}
            </Text>
            <Pressable
              className={`rounded-2xl py-4 items-center active:opacity-80
                ${isCorrect ? 'bg-green-600' : 'bg-red-500'}`}
              onPress={handleNext}
            >
              <Text className="text-white font-bold text-lg">
                {isLast ? 'See My Result' : 'Next Question'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

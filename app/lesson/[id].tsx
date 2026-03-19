import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { generateExerciseBatch } from '@/services/ai/exerciseGenerator';
import type { Exercise } from '@/types/exercise';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUserStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  async function handleGenerate() {
    if (!user) {
      setError('No user profile found. Please complete onboarding.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    const startMs = Date.now();

    try {
      const result = await generateExerciseBatch(
        'FILL_BLANK',
        user.target_language,
        user.native_language,
        user.current_level,
        'Subjunctive Mood',
      );
      setExercises(result);
      setFromCache(Date.now() - startMs < 300); // cache hits are fast
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }

  const firstExercise = exercises[0];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      {/* Progress bar */}
      <View className="bg-slate-100 h-2 mt-14">
        <View className="bg-primary-500 h-2" style={{ width: '30%' }} />
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-slate-500 text-2xl">✕</Text>
        </Pressable>
        <Text className="text-slate-600 font-semibold">Lesson {id}</Text>
        <Text className="text-red-500">❤️❤️❤️❤️❤️</Text>
      </View>

      {/* ── Test panel (Phase 1 dev tool) ── */}
      <View className="mx-6 mt-2 mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          AI Engine — Dev Test
        </Text>

        <Pressable
          className={`rounded-xl py-3 items-center flex-row justify-center gap-2
            ${isGenerating ? 'bg-primary-400' : 'bg-primary-600 active:opacity-80'}`}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? <ActivityIndicator size="small" color="white" /> : null}
          <Text className="text-white font-semibold">
            {isGenerating ? 'Generating…' : 'Generate Exercises (FILL_BLANK)'}
          </Text>
        </Pressable>

        {error ? (
          <View className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <Text className="text-red-600 text-xs">{error}</Text>
          </View>
        ) : null}

        {firstExercise ? (
          <View className="mt-3">
            <Text className="text-xs text-slate-400 mb-1">
              {exercises.length} exercises · model: {firstExercise.ai_model_used}
              {fromCache ? ' · ⚡ from cache' : ''}
            </Text>

            {/* First exercise preview */}
            <View className="bg-white border border-primary-200 rounded-xl p-3">
              <Text className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">
                Exercise 1 — {firstExercise.type}
              </Text>

              {'sentence' in firstExercise.content && (
                <>
                  <Text className="text-slate-800 text-sm font-medium mb-2">
                    {firstExercise.content.sentence}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {firstExercise.content.word_bank.map((w) => (
                      <View key={w} className="bg-slate-100 rounded-lg px-3 py-1">
                        <Text className="text-slate-700 text-sm">{w}</Text>
                      </View>
                    ))}
                  </View>
                  {firstExercise.content.grammar_hint ? (
                    <Text className="text-slate-400 text-xs mt-2 italic">
                      💡 {firstExercise.content.grammar_hint}
                    </Text>
                  ) : null}
                </>
              )}

              <Text className="text-slate-400 text-xs mt-2">
                Difficulty: {firstExercise.difficulty_score} ·{' '}
                {firstExercise.grammar_point ?? 'no grammar tag'}
              </Text>
            </View>

            {/* All exercises count */}
            {exercises.length > 1 ? (
              <Text className="text-slate-400 text-xs mt-2 text-center">
                + {exercises.length - 1} more in cache (see console)
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* ── Placeholder exercise UI (will be replaced in sub-task 3) ── */}
      <View className="flex-1 px-6 pt-2">
        <Text className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-2">
          Fill in the blank
        </Text>
        <Text className="text-slate-800 text-xl font-semibold mb-8 leading-8">
          Es importante que ella ___ la verdad.{'\n'}
          <Text className="text-slate-400 text-base">(subjunctive)</Text>
        </Text>

        <View className="flex-row flex-wrap gap-3 mb-8">
          {['diga', 'dice', 'diría', 'dijera'].map((word) => (
            <Pressable
              key={word}
              className="bg-slate-100 rounded-xl px-5 py-3 border-2 border-slate-200"
            >
              <Text className="text-slate-800 font-medium text-base">{word}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="px-6 pb-10">
        <Pressable
          className="bg-primary-600 rounded-2xl py-4 items-center"
          onPress={() => router.push(`/lesson-complete/${id}`)}
        >
          <Text className="text-white font-bold text-lg">Check Answer</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

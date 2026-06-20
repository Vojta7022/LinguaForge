import { View, Text, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useMemo, useState, useCallback } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useLessonStore } from '@/stores/lessonStore';
import { LESSONS, buildFallbackRoadmap } from '@/utils/lessonData';
import { getAccuracyByLesson } from '@/repositories/progressRepository';

const EMPTY_LESSONS: ReturnType<typeof buildFallbackRoadmap>['lessons'] = [];

function GrammarRow({
  lesson,
  accuracy,
  onPress,
}: {
  lesson: (typeof LESSONS)[number];
  accuracy: number;
  onPress: () => void;
}) {
  const hasPracticed = accuracy > 0;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-3 border-b border-slate-100 active:bg-slate-50 px-1"
    >
      <Text className="text-xl">{lesson.icon}</Text>
      <View className="flex-1">
        <Text className="text-slate-800 font-medium text-sm">{lesson.title}</Text>
        {hasPracticed ? (
          <View className="flex-row items-center gap-2 mt-1">
            <View className="flex-1 bg-slate-100 rounded-full h-1.5">
              <View
                className="bg-primary-500 h-1.5 rounded-full"
                style={{ width: `${accuracy}%` }}
              />
            </View>
            <Text className="text-xs text-slate-400">{accuracy}%</Text>
          </View>
        ) : (
          <Text className="text-xs text-slate-400 mt-0.5">Not practiced yet</Text>
        )}
      </View>
      <Text className="text-slate-300 text-lg">›</Text>
    </Pressable>
  );
}

export default function PracticeScreen() {
  const user = useUserStore((s) => s.user);
  const courseRoadmap = useLessonStore((s) => s.courseRoadmap);
  const roadmapLessons = courseRoadmap?.lessons ?? EMPTY_LESSONS;
  const fallbackLessons = useMemo(() => user
    ? buildFallbackRoadmap(user.target_language, user.native_language, user.current_level).lessons
    : LESSONS,
  [user]);
  const availableLessons = roadmapLessons.length > 0 ? roadmapLessons : fallbackLessons;
  const grammarLessons = availableLessons.filter((lesson) => lesson.lessonKind !== 'review').slice(0, 8);

  const [accuracyByLesson, setAccuracyByLesson] = useState<Record<string, number>>({});
  const userId = user?.id;

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      getAccuracyByLesson(userId)
        .then(setAccuracyByLesson)
        .catch(() => {});
    }, [userId]),
  );

  const weakLessons = grammarLessons
    .filter((l) => (accuracyByLesson[l.id] ?? 0) > 0 && (accuracyByLesson[l.id] ?? 0) < 60)
    .slice(0, 3);

  // Pick a "weak" topic — for now, just rotate through lessons
  const quickTopic = availableLessons[Math.floor(Date.now() / 86_400_000) % availableLessons.length];

  function handleQuickPractice() {
    router.push(`/lesson/practice-${quickTopic.id}`);
  }

  function handleChallenge() {
    // Challenge: first lesson, one level up
    router.push(`/lesson/challenge-${availableLessons[0].id}`);
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="bg-white px-6 pt-14 pb-5 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-800">Practice</Text>
        <Text className="text-slate-500 text-sm mt-1">
          {user ? `${user.current_level} · ${user.target_language.toUpperCase()}` : 'AI-generated exercises'}
        </Text>
      </View>

      <View className="px-5 py-5 gap-4">
        {/* Quick Practice */}
        <Pressable
          className="bg-primary-600 rounded-2xl p-5 active:opacity-80"
          onPress={handleQuickPractice}
        >
          <View className="flex-row items-center gap-3 mb-2">
            <Text className="text-3xl">🎯</Text>
            <Text className="text-white text-lg font-bold">Quick Practice</Text>
          </View>
          <Text className="text-primary-100 text-sm leading-5">
            AI generates exercises based on today's focus topic: {quickTopic.title}
          </Text>
          <View className="mt-3 bg-primary-500 rounded-xl px-4 py-2 self-start">
            <Text className="text-white text-xs font-semibold">Start now →</Text>
          </View>
        </Pressable>

        {/* Needs Work */}
        {weakLessons.length > 0 && (
          <View className="bg-red-50 rounded-2xl p-5 border border-red-100">
            <Text className="text-red-700 font-bold text-base mb-1">Needs Work</Text>
            <Text className="text-red-400 text-xs mb-3">Below 60% accuracy — extra practice recommended</Text>
            {weakLessons.map((lesson) => (
              <GrammarRow
                key={lesson.id}
                lesson={lesson}
                accuracy={accuracyByLesson[lesson.id] ?? 0}
                onPress={() => router.push(`/lesson/${lesson.id}`)}
              />
            ))}
          </View>
        )}

        {/* Grammar Focus */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-slate-800 font-bold text-base mb-1">Grammar Focus</Text>
          <Text className="text-slate-400 text-xs mb-3">
            Tap a topic to generate targeted exercises
          </Text>
          {grammarLessons.map((lesson) => (
            <GrammarRow
              key={lesson.id}
              lesson={lesson}
              accuracy={accuracyByLesson[lesson.id] ?? 0}
              onPress={() => router.push(`/lesson/${lesson.id}`)}
            />
          ))}
        </View>

        {/* Challenge Mode */}
        <Pressable
          className="bg-slate-800 rounded-2xl p-5 active:opacity-80"
          onPress={handleChallenge}
        >
          <View className="flex-row items-center gap-3 mb-2">
            <Text className="text-3xl">⚡</Text>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">Challenge Mode</Text>
              {user ? (
                <Text className="text-slate-400 text-xs">
                  Exercises at {user.current_level === 'C2' ? 'C2' : `one level above (${user.current_level === 'B1' ? 'B2' : user.current_level === 'B2' ? 'C1' : 'C2'})`}
                </Text>
              ) : null}
            </View>
          </View>
          <Text className="text-slate-300 text-sm leading-5">
            Push your limits with harder vocabulary, more complex grammar, and literary language.
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

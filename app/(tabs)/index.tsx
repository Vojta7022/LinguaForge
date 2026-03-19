import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { useEffect, useCallback, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getUser } from '@/repositories/userRepository';
import { useLessonStore } from '@/stores/lessonStore';
import { LESSONS, generateMoreLessons } from '@/utils/lessonData';
import { generateLessonTitle } from '@/services/ai/exerciseGenerator';
import type { LessonDefinition } from '@/utils/lessonData';

function PulseDot() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700 }),
        withTiming(1.0, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style} className="w-3 h-3 rounded-full bg-primary-400 absolute -top-1 -right-1" />
  );
}

function LessonNode({
  lesson,
  status,
  accuracyPct,
}: {
  lesson: LessonDefinition;
  status: 'completed' | 'active' | 'locked';
  accuracyPct?: number;
}) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';

  // Color-code accuracy
  const accuracyColor =
    accuracyPct === undefined ? '' :
    accuracyPct >= 80 ? 'text-green-600' :
    accuracyPct >= 60 ? 'text-amber-600' : 'text-red-500';

  function handlePress() {
    if (isLocked) return;
    router.push(`/lesson/${lesson.id}`);
  }

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center gap-4 p-4 rounded-2xl mb-3 border
        ${isCompleted
          ? 'bg-primary-50 border-primary-200'
          : isLocked
          ? 'bg-slate-50 border-slate-100 opacity-50'
          : 'bg-white border-primary-300 active:bg-primary-50'
        }`}
    >
      {/* Icon node */}
      <View className="relative">
        <View
          className={`w-14 h-14 rounded-2xl items-center justify-center
            ${isCompleted ? 'bg-primary-600' : isLocked ? 'bg-slate-200' : 'bg-primary-100'}`}
        >
          <Text className="text-2xl">
            {isCompleted ? '✓' : isLocked ? '🔒' : lesson.icon}
          </Text>
        </View>
        {status === 'active' ? <PulseDot /> : null}
      </View>

      {/* Text */}
      <View className="flex-1">
        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
          {lesson.unitTitle}
        </Text>
        <Text
          className={`text-base font-bold
            ${isCompleted ? 'text-primary-700' : isLocked ? 'text-slate-400' : 'text-slate-800'}`}
        >
          {lesson.title}
        </Text>
        <Text className="text-slate-500 text-sm" numberOfLines={1}>
          {lesson.description}
        </Text>
        {isCompleted && accuracyPct !== undefined ? (
          <Text className={`text-xs font-semibold mt-0.5 ${accuracyColor}`}>
            {accuracyPct}% accuracy{isCompleted ? ' · Redo' : ''}
          </Text>
        ) : null}
      </View>

      {/* Arrow */}
      {!isLocked ? (
        <Text className={`text-lg ${isCompleted ? 'text-primary-500' : 'text-slate-300'}`}>
          {isCompleted ? '★' : '›'}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function HomeScreen() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const initFromUser = useGamificationStore((s) => s.initFromUser);
  const dailyGoal = useGamificationStore((s) => s.dailyGoal);
  const completedIds = useLessonStore((s) => s.completedLessonIds);
  const lessonAccuracy = useLessonStore((s) => s.lessonAccuracy);
  const generatedLessons = useLessonStore((s) => s.generatedLessons);
  const addGeneratedLessons = useLessonStore((s) => s.addGeneratedLessons);

  const allLessons = [...LESSONS, ...generatedLessons];
  const isPrefetchingRef = useRef(false);

  // FIX 5: refresh XP/streak from SQLite when tab gains focus
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  useFocusEffect(
    useCallback(() => {
      const uid = userIdRef.current;
      if (!uid) return;
      getUser(uid).then((freshUser) => {
        if (freshUser) {
          setUser(freshUser);
          initFromUser(freshUser);
        }
      }).catch(() => {/* ignore */});
    }, [setUser, initFromUser]),
  );

  // Prefetch 3 new lessons when user reaches the second-to-last available lesson
  useEffect(() => {
    if (!user || isPrefetchingRef.current) return;

    // Find last unlocked lesson index
    let lastAvailableIdx = -1;
    for (let i = 0; i < allLessons.length; i++) {
      const lesson = allLessons[i];
      if (completedIds.includes(lesson.id) || i === 0 || completedIds.includes(allLessons[i - 1].id)) {
        lastAvailableIdx = i;
      }
    }

    // Trigger prefetch when on second-to-last lesson
    const shouldPrefetch = lastAvailableIdx >= allLessons.length - 2;
    if (!shouldPrefetch) return;

    isPrefetchingRef.current = true;
    const existingTopics = allLessons.map((l) => l.topic);
    const newLessons = generateMoreLessons(existingTopics, user.current_level, 3);

    // Fetch AI-generated titles in parallel
    Promise.allSettled(
      newLessons.map((l) =>
        generateLessonTitle(l.topic, user.current_level, user.target_language)
          .then((title) => ({ ...l, title }))
          .catch(() => l),
      ),
    ).then((results) => {
      const withTitles = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<LessonDefinition>).value);
      if (withTitles.length > 0) addGeneratedLessons(withTitles);
    }).finally(() => {
      isPrefetchingRef.current = false;
    });
  }, [completedIds.length, allLessons.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const xp = user?.xp ?? 0;
  const streak = user?.streak_count ?? 0;
  const level = user?.current_level ?? 'B2';
  const goalXp = dailyGoal.goal_xp;
  const earnedXp = dailyGoal.earned_xp;
  const goalProgress = Math.min(1, goalXp > 0 ? earnedXp / goalXp : 0);

  function getLessonStatus(index: number): 'completed' | 'active' | 'locked' {
    const lesson = allLessons[index];
    if (completedIds.includes(lesson.id)) return 'completed';
    if (index === 0) return 'active';
    const prev = allLessons[index - 1];
    return completedIds.includes(prev.id) ? 'active' : 'locked';
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-primary-600 px-6 pt-14 pb-6">
        <Text className="text-white text-sm font-medium opacity-80">
          {user?.display_name ? `Hi, ${user.display_name} 👋` : 'Good morning 👋'}
        </Text>
        <Text className="text-white text-2xl font-bold mt-1">Continue learning</Text>
      </View>

      <View className="px-5 py-5 gap-4">
        {/* Stats row */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-2xl mb-1">🔥</Text>
            <Text className="text-2xl font-bold text-slate-800">{streak}</Text>
            <Text className="text-slate-500 text-sm">day streak</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-2xl mb-1">⭐</Text>
            <Text className="text-2xl font-bold text-slate-800">{xp}</Text>
            <Text className="text-slate-500 text-sm">total XP</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-2xl mb-1">🎯</Text>
            <Text className="text-2xl font-bold text-slate-800">{level}</Text>
            <Text className="text-slate-500 text-sm">your level</Text>
          </View>
        </View>

        {/* Daily goal */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-slate-800 font-semibold text-base">Daily Goal</Text>
            <Text className="text-primary-600 font-bold text-sm">{earnedXp} / {goalXp} XP</Text>
          </View>
          <View className="bg-slate-100 rounded-full h-3">
            <View
              className="bg-primary-500 h-3 rounded-full"
              style={{ width: `${Math.round(goalProgress * 100)}%` }}
            />
          </View>
          {goalProgress >= 1 ? (
            <Text className="text-primary-600 font-semibold text-sm mt-2">🎉 Goal met for today!</Text>
          ) : null}
        </View>

        {/* Lesson path */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-slate-800 font-bold text-lg mb-4">Your Path</Text>
          {allLessons.map((lesson, index) => (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              status={getLessonStatus(index)}
              accuracyPct={lessonAccuracy[lesson.id]}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

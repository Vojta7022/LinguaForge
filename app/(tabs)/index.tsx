import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getUser } from '@/repositories/userRepository';
import { useLessonStore } from '@/stores/lessonStore';
import { ensureCourseRoadmap } from '@/services/ai/coursePlanner';
import { generateLessonExercises } from '@/services/ai/exerciseGenerator';
import { buildFallbackRoadmap } from '@/utils/lessonData';
import type { CourseRoadmap, LessonDefinition, RoadmapUnitDefinition } from '@/types/lesson';
import type { User } from '@/types/user';

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

function FocusChip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' }) {
  return (
    <View
      className={`rounded-full px-3 py-1 mr-2 mb-2 ${
        tone === 'accent' ? 'bg-primary-100' : 'bg-slate-100'
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          tone === 'accent' ? 'text-primary-700' : 'text-slate-600'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

function GuidebookCard({ unit }: { unit: RoadmapUnitDefinition }) {
  return (
    <View className="bg-amber-50 rounded-2xl border border-amber-200 p-4 mb-4">
      <Text className="text-amber-700 text-xs font-bold uppercase tracking-wide mb-1">
        Guidebook
      </Text>
      <Text className="text-slate-800 font-semibold text-sm leading-5 mb-3">
        {unit.description}
      </Text>
      <View className="flex-row flex-wrap mb-2">
        {unit.grammarFocus.map((item) => (
          <FocusChip key={`${unit.id}-grammar-${item}`} label={`Grammar: ${item}`} tone="accent" />
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {unit.vocabularyFocus.slice(0, 4).map((item) => (
          <FocusChip key={`${unit.id}-vocab-${item}`} label={item} />
        ))}
      </View>
    </View>
  );
}

function CourseMapGraphic({ units }: { units: RoadmapUnitDefinition[] }) {
  const preview = units.slice(0, 5);
  return (
    <View className="mt-5 bg-white/10 rounded-3xl p-4 border border-white/15">
      <View className="flex-row items-center justify-between">
        {preview.map((unit, index) => (
          <View key={unit.id} className="items-center">
            <View
              className={`w-11 h-11 rounded-full items-center justify-center border-2 ${
                index === 0 ? 'bg-white border-white' : 'bg-primary-500 border-primary-300'
              }`}
            >
              <Text className="text-xl">{unit.icon}</Text>
            </View>
            {index < preview.length - 1 ? (
              <View className="absolute left-11 top-5 h-0.5 w-8 bg-primary-300" />
            ) : null}
          </View>
        ))}
      </View>
      <Text className="text-primary-100 text-xs font-semibold mt-3">
        AI-planned around your interests
      </Text>
    </View>
  );
}

function PathLessonNode({
  lesson,
  status,
  accuracyPct,
  isLast,
}: {
  lesson: LessonDefinition;
  status: 'completed' | 'active' | 'locked';
  accuracyPct?: number;
  isLast: boolean;
}) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';

  function handlePress() {
    if (isLocked) return;
    router.push(`/lesson/${lesson.id}`);
  }

  const accuracyColor =
    accuracyPct === undefined ? '' :
    accuracyPct >= 80 ? 'text-green-600' :
    accuracyPct >= 60 ? 'text-amber-600' : 'text-red-500';

  return (
    <View className="flex-row gap-4">
      <View className="items-center">
        <View className="relative">
          <Pressable
            onPress={handlePress}
            className={`w-16 h-16 rounded-full border-4 items-center justify-center ${
              isCompleted
                ? 'bg-primary-600 border-primary-700'
                : isLocked
                ? 'bg-slate-100 border-slate-200'
                : 'bg-primary-100 border-primary-300'
            }`}
          >
            <Text className="text-2xl">{isCompleted ? '✓' : isLocked ? '🔒' : lesson.icon}</Text>
          </Pressable>
          {status === 'active' ? <PulseDot /> : null}
        </View>
        {!isLast ? (
          <View className={`w-1 flex-1 my-2 rounded-full ${isLocked ? 'bg-slate-200' : 'bg-primary-200'}`} />
        ) : null}
      </View>

      <Pressable
        onPress={handlePress}
        disabled={isLocked}
        className={`flex-1 rounded-3xl border p-4 mb-4 ${
          isCompleted
            ? 'bg-primary-50 border-primary-200'
            : isLocked
            ? 'bg-slate-50 border-slate-100 opacity-60'
            : 'bg-white border-primary-200'
        }`}
      >
        <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
          {lesson.focusLabel}
        </Text>
        <Text
          className={`text-base font-bold mb-1 ${
            isLocked ? 'text-slate-400' : isCompleted ? 'text-primary-700' : 'text-slate-800'
          }`}
        >
          {lesson.title}
        </Text>
        <Text className="text-slate-500 text-sm leading-5 mb-3">{lesson.description}</Text>
        <View className="flex-row flex-wrap">
          {lesson.vocabularyFocus.slice(0, 2).map((item) => (
            <FocusChip key={`${lesson.id}-${item}`} label={item} />
          ))}
        </View>
        {isCompleted && accuracyPct !== undefined ? (
          <Text className={`text-xs font-semibold mt-1 ${accuracyColor}`}>
            {accuracyPct}% accuracy
          </Text>
        ) : (
          <Text className="text-xs text-slate-400 mt-1">{lesson.objective}</Text>
        )}
      </Pressable>
    </View>
  );
}

function UnitCard({
  unit,
  lessons,
  completedIds,
  accuracyByLesson,
  getLessonStatus,
  getLessonIndex,
}: {
  unit: RoadmapUnitDefinition;
  lessons: LessonDefinition[];
  completedIds: string[];
  accuracyByLesson: Record<string, number>;
  getLessonStatus: (index: number) => 'completed' | 'active' | 'locked';
  getLessonIndex: (lessonId: string) => number;
}) {
  const completedCount = lessons.filter((lesson) => completedIds.includes(lesson.id)).length;

  return (
    <View className="bg-white rounded-[28px] p-5 border border-slate-100 mb-5">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-semibold uppercase tracking-wide text-primary-500 mb-1">
            {unit.theme}
          </Text>
          <Text className="text-slate-800 text-xl font-bold">
            {unit.icon} {unit.title}
          </Text>
          <Text className="text-slate-500 text-sm mt-1 leading-5">{unit.description}</Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
            Progress
          </Text>
          <Text className="text-slate-800 text-lg font-bold">
            {completedCount}/{lessons.length}
          </Text>
        </View>
      </View>

      <GuidebookCard unit={unit} />

      {unit.canDo.slice(0, 2).map((item) => (
        <Text key={`${unit.id}-${item}`} className="text-slate-500 text-sm leading-5 mb-2">
          • {item}
        </Text>
      ))}

      <View className="mt-3">
        {lessons.map((lesson, lessonIndex) => {
          const globalIndex = getLessonIndex(lesson.id);
          return (
            <PathLessonNode
              key={lesson.id}
              lesson={lesson}
              status={getLessonStatus(globalIndex)}
              accuracyPct={accuracyByLesson[lesson.id]}
              isLast={lessonIndex === lessons.length - 1}
            />
          );
        })}
      </View>
    </View>
  );
}

function roadmapMatchesUser(roadmap: CourseRoadmap | null, user: User | null) {
  if (!roadmap || !user) return false;
  return (
    roadmap.language === user.target_language &&
    roadmap.nativeLanguage === user.native_language &&
    roadmap.level === user.current_level &&
    roadmap.learningInterests === (user.learning_interests?.trim() || null) &&
    roadmap.avoidedTopics === (user.avoided_topics?.trim() || null)
  );
}

export default function HomeScreen() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const initFromUser = useGamificationStore((s) => s.initFromUser);
  const dailyGoal = useGamificationStore((s) => s.dailyGoal);
  const completedIds = useLessonStore((s) => s.completedLessonIds);
  const lessonAccuracy = useLessonStore((s) => s.lessonAccuracy);
  const courseRoadmap = useLessonStore((s) => s.courseRoadmap);
  const roadmapStatus = useLessonStore((s) => s.roadmapStatus);
  const roadmapError = useLessonStore((s) => s.roadmapError);
  const setCourseRoadmap = useLessonStore((s) => s.setCourseRoadmap);
  const setRoadmapStatus = useLessonStore((s) => s.setRoadmapStatus);
  const setRoadmapError = useLessonStore((s) => s.setRoadmapError);

  const userIdRef = useRef(user?.id);
  const roadmapFetchKeyRef = useRef<string | null>(null);
  const lessonPrefetchKeyRef = useRef<string | null>(null);
  userIdRef.current = user?.id;
  const currentRoadmapKey = user
    ? [
      user.target_language,
      user.native_language,
      user.current_level,
      user.learning_interests ?? '',
      user.avoided_topics ?? '',
    ].join(':')
    : null;

  useFocusEffect(
    useCallback(() => {
      const uid = userIdRef.current;
      if (!uid) return;
      getUser(uid).then((freshUser) => {
        if (freshUser) {
          setUser(freshUser);
          initFromUser(freshUser);
        }
      }).catch(() => {});
    }, [setUser, initFromUser]),
  );

  useEffect(() => {
    if (!user || !currentRoadmapKey) return;
    if (roadmapMatchesUser(courseRoadmap, user) && courseRoadmap?.source === 'ai') return;
    if (roadmapFetchKeyRef.current === currentRoadmapKey) return;

    roadmapFetchKeyRef.current = currentRoadmapKey;
    let cancelled = false;

    setRoadmapStatus('loading');
    setRoadmapError(null);

    ensureCourseRoadmap(
      user.target_language,
      user.native_language,
      user.current_level,
      user.learning_interests,
      user.avoided_topics,
    ).then((roadmap) => {
      if (cancelled) return;
      setCourseRoadmap(roadmap);
      if (roadmap.source === 'fallback') {
        setRoadmapError('Using a local roadmap for now. AI planning is continuing in the background.');
      }
    }).catch((err) => {
      if (cancelled) return;
      console.warn('[Roadmap] Failed to load:', err);
      setRoadmapStatus('error');
      setRoadmapError('Using a local roadmap for now. AI planning will retry later.');
    });

    return () => {
      cancelled = true;
    };
  }, [
    user,
    currentRoadmapKey,
    courseRoadmap,
    setCourseRoadmap,
    setRoadmapError,
    setRoadmapStatus,
  ]);

  const roadmap = useMemo(() => {
    if (!user) return null;
    if (roadmapMatchesUser(courseRoadmap, user)) return courseRoadmap;
    return buildFallbackRoadmap(
      user.target_language,
      user.native_language,
      user.current_level,
    );
  }, [courseRoadmap, user]);

  const lessonsById = useMemo(
    () => new Map((roadmap?.lessons ?? []).map((lesson, index) => [lesson.id, { lesson, index }])),
    [roadmap],
  );

  const nextActiveLesson = useMemo(() => {
    if (!roadmap) return null;
    for (let index = 0; index < roadmap.lessons.length; index++) {
      const lesson = roadmap.lessons[index];
      if (completedIds.includes(lesson.id)) continue;
      if (index === 0 || completedIds.includes(roadmap.lessons[index - 1].id)) {
        return lesson;
      }
      break;
    }
    return null;
  }, [roadmap, completedIds]);

  const xp = user?.xp ?? 0;
  const streak = user?.streak_count ?? 0;
  const level = user?.current_level ?? 'B2';
  const goalXp = dailyGoal.goal_xp;
  const earnedXp = dailyGoal.earned_xp;
  const goalProgress = Math.min(1, goalXp > 0 ? earnedXp / goalXp : 0);

  function getLessonStatus(index: number): 'completed' | 'active' | 'locked' {
    const allLessons = roadmap?.lessons ?? [];
    const lesson = allLessons[index];
    if (!lesson) return 'locked';
    if (completedIds.includes(lesson.id)) return 'completed';
    if (index === 0) return 'active';
    const prev = allLessons[index - 1];
    return completedIds.includes(prev.id) ? 'active' : 'locked';
  }

  function getLessonIndex(lessonId: string): number {
    return lessonsById.get(lessonId)?.index ?? -1;
  }

  useEffect(() => {
    if (!user || !roadmap || !nextActiveLesson) return;
    if (roadmapStatus === 'loading') return;

    const lessonLevel = nextActiveLesson.levelOverride ?? user.current_level;
    const prefetchKey = `${roadmap.id}:${nextActiveLesson.id}:${lessonLevel}`;
    if (lessonPrefetchKeyRef.current === prefetchKey) return;

    lessonPrefetchKeyRef.current = prefetchKey;
    generateLessonExercises(
      nextActiveLesson,
      user.target_language,
      user.native_language,
      lessonLevel,
    ).catch((err) => {
      console.warn('[Lesson Prefetch] Failed:', (err as Error).message);
    });
  }, [user, roadmap, nextActiveLesson, roadmapStatus]);

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="bg-primary-600 px-6 pt-14 pb-6">
        <Text className="text-white text-sm font-medium opacity-80">
          {user?.display_name ? `Hi, ${user.display_name} 👋` : 'Good morning 👋'}
        </Text>
        <Text className="text-white text-2xl font-bold mt-1">Your learning path</Text>
        <Text className="text-primary-100 text-sm mt-2 leading-5">
          {roadmap?.summary ?? 'AI is preparing a structured path with clear unit goals.'}
        </Text>
        {roadmap?.units.length ? <CourseMapGraphic units={roadmap.units} /> : null}
      </View>

      <View className="px-5 py-5 gap-4">
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
            <Text className="text-primary-600 font-semibold text-sm mt-2">Goal met for today!</Text>
          ) : null}
        </View>

        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-slate-800 font-bold text-lg mb-1">Upcoming Units</Text>
          <Text className="text-slate-500 text-sm leading-5">
            The planner maps 10 units ahead so each lesson has a clear role before the exercises are generated.
          </Text>
          {roadmap && roadmap.source === 'ai' ? (
            <View className="mt-4 self-start bg-primary-50 border border-primary-200 rounded-full px-3 py-1.5">
              <Text className="text-primary-700 text-xs font-semibold">
                AI roadmap ready
              </Text>
            </View>
          ) : null}
          {roadmapError ? (
            <Text className="text-amber-600 text-xs font-semibold mt-3">{roadmapError}</Text>
          ) : null}
          {roadmapStatus === 'loading' ? (
            <Text className="text-slate-400 text-xs font-semibold mt-3">
              AI is refreshing your roadmap and next lesson in the background.
            </Text>
          ) : null}
          {nextActiveLesson ? (
            <Text className="text-slate-500 text-xs mt-3">
              Next up: {nextActiveLesson.title}
            </Text>
          ) : null}
        </View>

        {roadmap?.units.map((unit) => {
          const lessons = unit.lessonIds
            .map((lessonId) => lessonsById.get(lessonId)?.lesson)
            .filter((lesson): lesson is LessonDefinition => Boolean(lesson));

          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              lessons={lessons}
              completedIds={completedIds}
              accuracyByLesson={lessonAccuracy}
              getLessonStatus={getLessonStatus}
              getLessonIndex={getLessonIndex}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

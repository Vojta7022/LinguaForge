import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useLessonStore } from '@/stores/lessonStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useUserStore } from '@/stores/userStore';
import { getLessonById } from '@/utils/lessonData';

export default function LessonCompleteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useLessonStore((s) => s.activeSession);
  const markLessonComplete = useLessonStore((s) => s.markLessonComplete);
  const { awardXP, awardDailyGoalBonus, checkAndUpdateStreak,
    dailyGoalJustMet, streakMilestone, clearMilestone } = useGamificationStore();
  const { user, addXP, saveToDB, setUser } = useUserStore();
  const lessonDef = getLessonById(id, user?.current_level);

  const answered = session?.exercises_answered ?? 0;
  const correct = session?.exercises_correct ?? 0;
  const accuracy = answered > 0 ? correct / answered : 0;
  const isPerfect = accuracy === 1 && answered > 0;
  const baseXP = session?.xp_earned ?? 0;
  const minutes = Math.round((session?.time_spent_seconds ?? 0) / 60);

  const [totalXPAwarded, setTotalXPAwarded] = useState(baseXP);
  const [goalBonus, setGoalBonus] = useState(0);
  const [newStreak, setNewStreak] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    let extra = 0;

    // Perfect lesson bonus
    if (isPerfect) {
      extra += awardXP('perfect_lesson', user.current_level);
    }

    // Daily goal bonus (if just met this lesson)
    if (dailyGoalJustMet) {
      const bonus = awardDailyGoalBonus(user.current_level);
      extra += bonus;
      setGoalBonus(bonus);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setTotalXPAwarded(baseXP + extra);
    addXP(baseXP + extra);
    markLessonComplete(id);

    // Update streak
    checkAndUpdateStreak(user).then((updatedUser) => {
      setUser(updatedUser);
      setNewStreak(updatedUser.streak_count);
      saveToDB().catch((err) => console.warn('[Lesson] Persist failed:', err));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show milestone notification briefly
  useEffect(() => {
    if (streakMilestone) {
      setTimeout(() => clearMilestone(), 4000);
    }
  }, [streakMilestone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 }}
    >
      <Text className="text-7xl mb-4">{isPerfect ? '🏆' : '🎉'}</Text>
      <Text className="text-3xl font-bold text-slate-800 text-center mb-1">
        {isPerfect ? 'Perfect Lesson!' : 'Lesson Complete!'}
      </Text>
      <Text className="text-slate-500 text-base text-center mb-8">{lessonDef.title}</Text>

      {/* Stats */}
      <View className="flex-row gap-4 mb-6">
        <StatChip emoji="⭐" value={`+${totalXPAwarded}`} label="XP" highlight={isPerfect} />
        <StatChip emoji="✅" value={`${correct}/${answered}`} label="Correct" highlight={isPerfect} />
        <StatChip emoji="⏱" value={minutes > 0 ? `${minutes}m` : '<1m'} label="Time" />
      </View>

      {/* Accuracy bar */}
      <View className="w-full bg-slate-100 rounded-full h-3 mb-2">
        <View
          className={`h-3 rounded-full ${accuracy >= 0.8 ? 'bg-green-500' : accuracy >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}`}
          style={{ width: `${Math.round(accuracy * 100)}%` }}
        />
      </View>
      <Text className="text-slate-500 text-sm mb-6 self-start">
        {Math.round(accuracy * 100)}% accuracy
      </Text>

      {/* Streak info */}
      {newStreak !== null && newStreak > 0 ? (
        <View className="w-full bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
          <Text className="text-2xl">🔥</Text>
          <View className="flex-1">
            <Text className="text-orange-700 font-bold">{newStreak}-day streak!</Text>
            {streakMilestone ? (
              <Text className="text-orange-600 text-sm">🎖 Milestone: {streakMilestone} days!</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Daily goal bonus */}
      {goalBonus > 0 ? (
        <View className="w-full bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
          <Text className="text-2xl">🎯</Text>
          <Text className="text-green-700 font-bold flex-1">Daily goal reached! +{goalBonus} XP</Text>
        </View>
      ) : null}

      {/* Perfect bonus */}
      {isPerfect ? (
        <View className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <Text className="text-amber-700 font-bold text-center">🌟 Perfect score bonus applied!</Text>
        </View>
      ) : null}

      <Pressable
        className="bg-primary-600 rounded-2xl py-4 w-full items-center mb-4 active:opacity-80"
        onPress={() => router.replace('/(tabs)')}
      >
        <Text className="text-white font-bold text-lg">Continue</Text>
      </Pressable>

      <Pressable onPress={() => router.replace(`/lesson/${id}`)}>
        <Text className="text-primary-600 font-semibold text-base">Practice Again</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatChip({ emoji, value, label, highlight = false }: {
  emoji: string; value: string; label: string; highlight?: boolean;
}) {
  return (
    <View className={`flex-1 items-center rounded-2xl px-3 py-4 border
      ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}
    >
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className={`text-lg font-bold ${highlight ? 'text-amber-700' : 'text-slate-800'}`}>{value}</Text>
      <Text className="text-slate-500 text-xs">{label}</Text>
    </View>
  );
}

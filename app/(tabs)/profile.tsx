import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useLessonStore } from '@/stores/lessonStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { xpToLevel } from '@/utils/xpCalculator';
import { LANGUAGE_FLAGS, LANGUAGE_NAMES, CEFR_DESCRIPTORS } from '@/types/user';
import type { CEFRLevel } from '@/types/user';
import {
  getAccuracyByType,
  getWeeklyActivity,
  getTotalStats,
  type TypeAccuracy,
  type DayActivity,
  type TotalStats,
} from '@/repositories/progressRepository';

const CEFR_LEVELS: CEFRLevel[] = ['B1', 'B2', 'C1', 'C2'];

// ─── Sub-components ───────────────────────────────────────────────────────

function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View className="bg-slate-50 rounded-xl p-3 items-center border border-slate-100" style={{ minWidth: '30%', flex: 1 }}>
      <Text className="text-xl mb-0.5">{emoji}</Text>
      <Text className="text-base font-bold text-slate-800">{value}</Text>
      <Text className="text-slate-400 text-xs text-center">{label}</Text>
    </View>
  );
}

function TypeAccuracyBar({ type, percentage, total }: TypeAccuracy) {
  const label = type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const barColor =
    percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-slate-600 text-xs">{label}</Text>
        <Text className="text-slate-500 text-xs">{percentage}% · {total} attempts</Text>
      </View>
      <View className="bg-slate-100 rounded-full h-2">
        <View className={`${barColor} h-2 rounded-full`} style={{ width: `${Math.max(percentage, 2)}%` }} />
      </View>
    </View>
  );
}

function WeeklyChart({ data }: { data: DayActivity[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const BAR_HEIGHT = 56;

  return (
    <View className="flex-row items-end gap-1">
      {data.map(({ date, count }) => {
        const barH = count > 0 ? Math.max(6, Math.round((count / maxCount) * BAR_HEIGHT)) : 4;
        const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
        const isToday = date === new Date().toISOString().slice(0, 10);
        return (
          <View key={date} className="flex-1 items-center gap-1">
            {count > 0 ? (
              <Text className="text-slate-400 text-xs">{count}</Text>
            ) : (
              <Text className="text-transparent text-xs">0</Text>
            )}
            <View style={{ height: BAR_HEIGHT }} className="w-full items-center justify-end">
              <View
                className={`w-5 rounded-t-md ${isToday ? 'bg-primary-500' : 'bg-primary-200'}`}
                style={{ height: barH }}
              />
            </View>
            <Text className={`text-xs ${isToday ? 'text-primary-600 font-bold' : 'text-slate-400'}`}>
              {dayLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { signOut, isGuest } = useAuthStore();
  const user = useUserStore((s) => s.user);
  const { streak } = useGamificationStore();
  const completedLessonIds = useLessonStore((s) => s.completedLessonIds);
  const { settings, updateSetting } = useSettingsStore();

  const [typeAccuracy, setTypeAccuracy] = useState<TypeAccuracy[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<DayActivity[]>([]);
  const [totalStats, setTotalStats] = useState<TotalStats>({ completed: 0, correct: 0, uniqueTopics: 0 });

  useEffect(() => {
    if (!user) return;
    const uid = user.id;
    Promise.all([
      getAccuracyByType(uid),
      getWeeklyActivity(uid),
      getTotalStats(uid),
    ]).then(([byType, weekly, totals]) => {
      setTypeAccuracy(byType);
      setWeeklyActivity(weekly);
      setTotalStats(totals);
    }).catch((err) => console.warn('[Profile] Stats load failed:', err));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const { level: numericLevel, progress: levelProgress } = xpToLevel(user.xp);
  const overallAccuracyPct = totalStats.completed > 0
    ? Math.round((totalStats.correct / totalStats.completed) * 100)
    : 0;

  const cefrIndex = CEFR_LEVELS.indexOf(user.current_level);
  const initial = user.display_name?.[0]?.toUpperCase() ?? '?';

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      {/* Header / avatar */}
      <View className="bg-primary-600 px-6 pt-14 pb-8 items-center">
        <View className="w-20 h-20 bg-primary-400 rounded-full items-center justify-center mb-3">
          <Text className="text-4xl font-bold text-white">{initial}</Text>
        </View>
        <Text className="text-white text-xl font-bold">{user.display_name}</Text>
        <Text className="text-primary-100 text-sm mt-1">{user.email}</Text>
        <View className="flex-row items-center gap-2 mt-2">
          <Text className="text-lg">{LANGUAGE_FLAGS[user.target_language]}</Text>
          <Text className="text-primary-100 text-sm">
            {LANGUAGE_NAMES[user.target_language]} learner · Level {numericLevel}
          </Text>
        </View>
      </View>

      <View className="px-5 py-5 gap-4">
        {/* Guest upgrade banner */}
        {isGuest ? (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row items-center gap-3">
            <Text className="text-2xl">☁️</Text>
            <View className="flex-1">
              <Text className="text-amber-800 font-semibold text-sm">Progress saved locally</Text>
              <Text className="text-amber-700 text-xs mt-0.5">
                Create an account to sync across devices
              </Text>
            </View>
            <Pressable
              className="bg-amber-500 rounded-xl px-3 py-2 active:opacity-80"
              onPress={() => router.push('/(auth)/register')}
            >
              <Text className="text-white font-bold text-xs">Sign up</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Stats grid */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-slate-800 font-bold text-base mb-4">Stats</Text>
          <View className="flex-row flex-wrap gap-3">
            <StatCard emoji="⭐" value={user.xp.toLocaleString()} label="Total XP" />
            <StatCard emoji="🔥" value={`${user.streak_count}`} label="Current streak" />
            <StatCard emoji="🏅" value={`${streak.longest_streak}`} label="Best streak" />
            <StatCard emoji="📚" value={`${completedLessonIds.length}`} label="Lessons done" />
            <StatCard
              emoji="✅"
              value={totalStats.completed > 0 ? `${overallAccuracyPct}%` : '—'}
              label="Accuracy"
            />
            <StatCard
              emoji="💡"
              value={totalStats.uniqueTopics > 0 ? `${totalStats.uniqueTopics}` : '—'}
              label="Topics learned"
            />
          </View>
          <View className="flex-row gap-3 mt-3">
            <StatCard emoji="📝" value={`${totalStats.completed}`} label="Exercises done" />
            <StatCard emoji="🎯" value={`Lv. ${numericLevel}`} label="App level" />
            <View className="flex-1 opacity-0" />
          </View>

          {/* Level progress bar */}
          <View className="mt-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-slate-400 font-medium">Level {numericLevel}</Text>
              <Text className="text-xs text-slate-400 font-medium">Level {numericLevel + 1}</Text>
            </View>
            <View className="bg-slate-100 rounded-full h-2">
              <View className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.round(levelProgress * 100)}%` }} />
            </View>
            <Text className="text-xs text-slate-400 mt-1 text-right">
              {Math.round(levelProgress * 100)}% to next level
            </Text>
          </View>
        </View>

        {/* Weekly activity chart */}
        {weeklyActivity.length > 0 ? (
          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <Text className="text-slate-800 font-bold text-base mb-4">This Week</Text>
            <WeeklyChart data={weeklyActivity} />
            <Text className="text-slate-400 text-xs mt-3 text-center">
              Exercises completed per day
            </Text>
          </View>
        ) : null}

        {/* Accuracy by exercise type */}
        {typeAccuracy.length > 0 ? (
          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <Text className="text-slate-800 font-bold text-base mb-4">Accuracy by Type</Text>
            {typeAccuracy.map((t) => (
              <TypeAccuracyBar key={t.type} {...t} />
            ))}
          </View>
        ) : null}

        {/* CEFR level track */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-slate-800 font-bold text-base mb-3">CEFR Progress</Text>
          <View className="flex-row items-center gap-1 mb-3">
            {CEFR_LEVELS.map((lvl, i) => {
              const isActive = lvl === user.current_level;
              const isPast = cefrIndex > i;
              return (
                <View key={lvl} className="flex-1 items-center">
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center mb-1
                      ${isActive ? 'bg-primary-600' : isPast ? 'bg-primary-200' : 'bg-slate-100'}`}
                  >
                    <Text className={`text-xs font-bold ${isActive ? 'text-white' : isPast ? 'text-primary-700' : 'text-slate-400'}`}>
                      {lvl}
                    </Text>
                  </View>
                  {i < CEFR_LEVELS.length - 1 ? (
                    <View className={`absolute right-0 top-4 w-full h-0.5 ${isPast ? 'bg-primary-200' : 'bg-slate-100'}`} style={{ zIndex: -1 }} />
                  ) : null}
                </View>
              );
            })}
          </View>
          <Text className="text-slate-500 text-xs">
            {CEFR_DESCRIPTORS[user.current_level]}
          </Text>
        </View>

        {/* Current language */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 flex-row items-center gap-4">
          <Text className="text-3xl">{LANGUAGE_FLAGS[user.target_language]}</Text>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Learning</Text>
            <Text className="text-slate-800 font-bold text-base">{LANGUAGE_NAMES[user.target_language]}</Text>
            <Text className="text-slate-500 text-xs">
              Native: {LANGUAGE_FLAGS[user.native_language]} {LANGUAGE_NAMES[user.native_language]}
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-slate-100">
            <Text className="text-slate-700 font-medium">Daily Goal</Text>
            <Text className="text-slate-400 text-sm">{user.daily_goal} XP/day</Text>
          </View>

          <View className="flex-row justify-between items-center px-5 py-3 border-b border-slate-100">
            <Text className="text-slate-700 font-medium">Haptic Feedback</Text>
            <Switch
              value={settings.haptic_feedback}
              onValueChange={(v) => updateSetting('haptic_feedback', v)}
              trackColor={{ true: '#0D9488' }}
            />
          </View>

          <View className="flex-row justify-between items-center px-5 py-3">
            <Text className="text-slate-700 font-medium">Auto-play Audio</Text>
            <Switch
              value={settings.auto_play_audio}
              onValueChange={(v) => updateSetting('auto_play_audio', v)}
              trackColor={{ true: '#0D9488' }}
            />
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          className="bg-red-50 rounded-2xl p-4 items-center border border-red-100 active:opacity-70"
          onPress={() => signOut()}
        >
          <Text className="text-red-500 font-semibold">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

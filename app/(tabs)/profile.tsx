import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useProgressStore } from '@/stores/progressStore';
import { useLessonStore } from '@/stores/lessonStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { xpToLevel } from '@/utils/xpCalculator';
import { LANGUAGE_FLAGS, LANGUAGE_NAMES, CEFR_DESCRIPTORS } from '@/types/user';
import type { CEFRLevel } from '@/types/user';

const CEFR_LEVELS: CEFRLevel[] = ['B1', 'B2', 'C1', 'C2'];

export default function ProfileScreen() {
  const { signOut, isGuest } = useAuthStore();
  const user = useUserStore((s) => s.user);
  const { streak } = useGamificationStore();
  const recentProgress = useProgressStore((s) => s.recentProgress);
  const completedLessonIds = useLessonStore((s) => s.completedLessonIds);
  const { settings, updateSetting } = useSettingsStore();

  if (!user) return null;

  const { level: numericLevel, progress: levelProgress } = xpToLevel(user.xp);

  // Lifetime accuracy from in-memory progress (best-effort)
  const totalAttempts = recentProgress.length;
  const correctAttempts = recentProgress.filter((p) => p.is_correct).length;
  const accuracyPct = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  const cefrIndex = CEFR_LEVELS.indexOf(user.current_level);
  const cefrProgress = cefrIndex >= 0 ? (cefrIndex + 0.5) / CEFR_LEVELS.length : 0.5;

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
              value={totalAttempts > 0 ? `${accuracyPct}%` : '—'}
              label="Accuracy"
            />
            <StatCard emoji="🎯" value={`Lv. ${numericLevel}`} label="App level" />
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

function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View className="bg-slate-50 rounded-xl p-3 items-center border border-slate-100" style={{ minWidth: '30%', flex: 1 }}>
      <Text className="text-xl mb-0.5">{emoji}</Text>
      <Text className="text-base font-bold text-slate-800">{value}</Text>
      <Text className="text-slate-400 text-xs text-center">{label}</Text>
    </View>
  );
}

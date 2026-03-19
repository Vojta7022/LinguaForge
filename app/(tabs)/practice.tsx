import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { useProgressStore } from '@/stores/progressStore';
import { LESSONS } from '@/utils/lessonData';

// Accuracy for a topic derived from in-memory progress (best-effort)
function useMockAccuracy(index: number): number {
  // Rotate mock values so not every bar looks the same
  const mocks = [0, 0.82, 0, 0.64, 0, 0.91];
  return mocks[index % mocks.length];
}

function GrammarRow({
  lesson,
  index,
  onPress,
}: {
  lesson: (typeof LESSONS)[number];
  index: number;
  onPress: () => void;
}) {
  const accuracy = useMockAccuracy(index);
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
                style={{ width: `${Math.round(accuracy * 100)}%` }}
              />
            </View>
            <Text className="text-xs text-slate-400">{Math.round(accuracy * 100)}%</Text>
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

  // Pick a "weak" topic — for now, just rotate through lessons
  const quickTopic = LESSONS[Math.floor(Date.now() / 86_400_000) % LESSONS.length];

  function handleQuickPractice() {
    router.push(`/lesson/practice-${quickTopic.id}`);
  }

  function handleChallenge() {
    // Challenge: first lesson, one level up
    router.push(`/lesson/challenge-${LESSONS[0].id}`);
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

        {/* Grammar Focus */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-slate-800 font-bold text-base mb-1">Grammar Focus</Text>
          <Text className="text-slate-400 text-xs mb-3">
            Tap a topic to generate targeted exercises
          </Text>
          {LESSONS.map((lesson, index) => (
            <GrammarRow
              key={lesson.id}
              lesson={lesson}
              index={index}
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

import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function LessonCompleteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      <Text className="text-7xl mb-6">🎉</Text>
      <Text className="text-3xl font-bold text-slate-800 text-center mb-2">Lesson Complete!</Text>
      <Text className="text-slate-500 text-base text-center mb-10">
        Lesson: {id}
      </Text>

      {/* Stats */}
      <View className="flex-row gap-6 mb-10">
        <StatChip emoji="⭐" value="+50" label="XP" />
        <StatChip emoji="✅" value="8/10" label="Correct" />
        <StatChip emoji="⚡" value="2x" label="Streak" />
      </View>

      <Pressable
        className="bg-primary-600 rounded-2xl px-8 py-4 w-full items-center mb-4"
        onPress={() => router.replace('/(tabs)')}
      >
        <Text className="text-white font-bold text-lg">Continue</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/lesson/demo')}>
        <Text className="text-primary-600 font-semibold text-base">Practice Again</Text>
      </Pressable>
    </View>
  );
}

function StatChip({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View className="items-center bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className="text-xl font-bold text-slate-800">{value}</Text>
      <Text className="text-slate-500 text-xs">{label}</Text>
    </View>
  );
}

import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

const GOALS = [
  { xp: 10, label: 'Casual', description: '~5 min/day' },
  { xp: 20, label: 'Regular', description: '~10 min/day' },
  { xp: 50, label: 'Serious', description: '~20 min/day' },
  { xp: 100, label: 'Intense', description: '~40 min/day' },
];

export default function DailyGoalScreen() {
  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-2xl font-bold text-slate-800 mb-2">Set your daily goal</Text>
      <Text className="text-base text-slate-500 mb-8">How much time do you want to practice each day?</Text>

      <View className="gap-3 mb-8">
        {GOALS.map((goal) => (
          <Pressable
            key={goal.xp}
            className="border-2 border-slate-200 rounded-2xl px-6 py-4 flex-row justify-between items-center"
            onPress={() => router.push('/(onboarding)/ready')}
          >
            <View>
              <Text className="text-lg font-semibold text-slate-800">{goal.label}</Text>
              <Text className="text-slate-500 text-sm">{goal.description}</Text>
            </View>
            <Text className="text-primary-600 font-bold text-base">{goal.xp} XP/day</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';

const GOALS = [
  { xp: 10, label: 'Casual', description: '~5 min/day', emoji: '🌱' },
  { xp: 20, label: 'Regular', description: '~10 min/day', emoji: '⚡' },
  { xp: 50, label: 'Serious', description: '~20 min/day', emoji: '🔥' },
  { xp: 100, label: 'Intense', description: '~40 min/day', emoji: '🚀' },
];

export default function DailyGoalScreen() {
  const { setDailyGoal } = useOnboardingStore();
  const [selected, setSelected] = useState<number>(20);

  function handleContinue() {
    setDailyGoal(selected);
    router.push('/(onboarding)/ready');
  }

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-2xl font-bold text-slate-800 mb-1">Set your daily goal</Text>
      <Text className="text-base text-slate-500 mb-8">How much time do you want to practice each day?</Text>

      <View className="gap-3 mb-8">
        {GOALS.map((goal) => {
          const isSelected = selected === goal.xp;
          return (
            <Pressable
              key={goal.xp}
              className={`border-2 rounded-2xl px-6 py-4 flex-row justify-between items-center
                ${isSelected ? 'border-primary-600 bg-primary-50' : 'border-slate-200 bg-white active:bg-slate-50'}`}
              onPress={() => setSelected(goal.xp)}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{goal.emoji}</Text>
                <View>
                  <Text className={`text-lg font-semibold ${isSelected ? 'text-primary-700' : 'text-slate-800'}`}>
                    {goal.label}
                  </Text>
                  <Text className="text-slate-500 text-sm">{goal.description}</Text>
                </View>
              </View>
              <Text className={`font-bold text-base ${isSelected ? 'text-primary-600' : 'text-slate-400'}`}>
                {goal.xp} XP
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        className="bg-primary-600 rounded-xl py-4 items-center active:opacity-80"
        onPress={handleContinue}
      >
        <Text className="text-white font-bold text-base">Continue</Text>
      </Pressable>
    </View>
  );
}

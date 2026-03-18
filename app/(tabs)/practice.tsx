import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

const MODES = [
  { id: 'weak-areas', label: 'Weak Areas', emoji: '🎯', description: 'Focus on your mistakes' },
  { id: 'grammar', label: 'Grammar Drill', emoji: '📐', description: 'Deep grammar practice' },
  { id: 'vocab', label: 'Vocabulary', emoji: '📚', description: 'Build your word bank' },
  { id: 'challenge', label: 'Challenge Mode', emoji: '⚡', description: 'Push to the next level' },
];

export default function PracticeScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-6 pt-14 pb-5 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-800">Practice</Text>
        <Text className="text-slate-500 text-sm mt-1">Choose a focus area</Text>
      </View>

      <View className="px-6 pt-6 gap-3">
        {MODES.map((mode) => (
          <Pressable
            key={mode.id}
            className="bg-white rounded-2xl p-5 border border-slate-100 flex-row items-center gap-4"
            onPress={() => router.push('/lesson/demo')}
          >
            <Text className="text-3xl">{mode.emoji}</Text>
            <View className="flex-1">
              <Text className="text-slate-800 font-semibold text-base">{mode.label}</Text>
              <Text className="text-slate-500 text-sm">{mode.description}</Text>
            </View>
            <Text className="text-slate-300 text-xl">›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

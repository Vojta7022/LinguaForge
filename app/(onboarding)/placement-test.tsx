import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function PlacementTestScreen() {
  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-2xl font-bold text-slate-800 mb-2">Let's find your level</Text>
      <Text className="text-base text-slate-500 mb-8">
        10 quick questions to place you at B1, B2, C1, or C2. Powered by AI.
      </Text>

      {/* TODO: AI-generated adaptive placement test (Phase 1) */}
      <Text className="text-slate-400 text-sm text-center mb-8">[AI placement test — Phase 1]</Text>

      <Pressable
        className="bg-primary-600 rounded-2xl px-8 py-4 items-center"
        onPress={() => router.push('/(onboarding)/daily-goal')}
      >
        <Text className="text-white font-bold text-lg">Skip for now</Text>
      </Pressable>
    </View>
  );
}

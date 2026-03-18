import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function ReadyScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-6xl mb-6">🚀</Text>
      <Text className="text-3xl font-bold text-slate-800 text-center mb-4">You're all set!</Text>
      <Text className="text-base text-slate-500 text-center mb-12">
        Your AI-powered language journey begins now. Let's forge your language skills.
      </Text>

      <Pressable
        className="bg-primary-600 rounded-2xl px-8 py-4 w-full items-center"
        onPress={() => router.replace('/(tabs)')}
      >
        <Text className="text-white font-bold text-lg">Start Learning</Text>
      </Pressable>
    </View>
  );
}

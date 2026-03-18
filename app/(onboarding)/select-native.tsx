import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function SelectNativeScreen() {
  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-2xl font-bold text-slate-800 mb-2">What's your native language?</Text>
      <Text className="text-base text-slate-500 mb-8">We'll tailor exercises to help you avoid common mistakes.</Text>

      {/* TODO: language grid with flags */}
      <Text className="text-slate-400 text-sm text-center mb-8">[Language selector — Phase 1]</Text>

      <Pressable
        className="bg-primary-600 rounded-2xl px-8 py-4 items-center"
        onPress={() => router.push('/(onboarding)/select-target')}
      >
        <Text className="text-white font-bold text-lg">Continue</Text>
      </Pressable>
    </View>
  );
}

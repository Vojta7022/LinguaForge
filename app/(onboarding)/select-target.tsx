import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function SelectTargetScreen() {
  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-2xl font-bold text-slate-800 mb-2">Which language are you learning?</Text>
      <Text className="text-base text-slate-500 mb-8">Choose the language you want to master.</Text>

      {/* TODO: language grid with flags */}
      <Text className="text-slate-400 text-sm text-center mb-8">[Target language selector — Phase 1]</Text>

      <Pressable
        className="bg-primary-600 rounded-2xl px-8 py-4 items-center"
        onPress={() => router.push('/(onboarding)/placement-test')}
      >
        <Text className="text-white font-bold text-lg">Continue</Text>
      </Pressable>
    </View>
  );
}

import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-primary-600 px-8">
      <Text className="text-5xl mb-4">🌐</Text>
      <Text className="text-4xl font-bold text-white text-center mb-3">LinguaForge</Text>
      <Text className="text-lg text-primary-100 text-center mb-12">
        Master B2–C2 languages with AI-powered exercises that actually challenge you.
      </Text>

      <Pressable
        className="bg-white rounded-2xl px-8 py-4 w-full items-center mb-4"
        onPress={() => router.push('/(onboarding)/select-native')}
      >
        <Text className="text-primary-600 font-bold text-lg">Get Started</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/login')}>
        <Text className="text-primary-100 text-base">Already have an account? Sign in</Text>
      </Pressable>
    </View>
  );
}

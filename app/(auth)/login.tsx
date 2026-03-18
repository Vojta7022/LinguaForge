import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-primary-600 mb-2">LinguaForge</Text>
      <Text className="text-base text-slate-500 mb-10">Sign in to continue</Text>

      {/* TODO: email/password form + Supabase auth */}
      <Text className="text-slate-400 text-sm mb-6">[Login form — Phase 0]</Text>

      <Link href="/(onboarding)/welcome">
        <Text className="text-primary-600 font-semibold">Continue as guest →</Text>
      </Link>
    </View>
  );
}

import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function RegisterScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-primary-600 mb-2">Create Account</Text>
      <Text className="text-base text-slate-500 mb-10">Join LinguaForge for free</Text>

      {/* TODO: registration form + Supabase auth */}
      <Text className="text-slate-400 text-sm mb-6">[Register form — Phase 0]</Text>

      <Link href="/(auth)/login">
        <Text className="text-primary-600 font-semibold">Already have an account? Sign in</Text>
      </Link>
    </View>
  );
}

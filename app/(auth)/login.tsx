import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const { signIn, continueAsGuest, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch {
      // Error is already set in the store
    }
  }

  async function handleGuest() {
    setGuestLoading(true);
    try {
      await continueAsGuest();
      // _layout.tsx will route to onboarding once isGuest is true
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-10">
            <Text className="text-5xl mb-3">🌐</Text>
            <Text className="text-3xl font-bold text-slate-800">Welcome back</Text>
            <Text className="text-slate-500 text-base mt-2 text-center">
              Sign in to continue your journey
            </Text>
          </View>

          {/* Form */}
          <View className="gap-3 mb-4">
            <View>
              <Text className="text-slate-600 text-sm font-medium mb-1.5">Email</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-base"
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            <View>
              <Text className="text-slate-600 text-sm font-medium mb-1.5">Password</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-base"
                placeholder="Your password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Sign in button */}
          <Pressable
            className={`bg-primary-600 rounded-xl py-4 items-center justify-center flex-row gap-2 mb-3
              ${isLoading || !email || !password ? 'opacity-60' : 'active:opacity-80'}`}
            onPress={handleLogin}
            disabled={isLoading || !email.trim() || !password}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : null}
            <Text className="text-white font-bold text-base">
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Text>
          </Pressable>

          {/* Sign up link */}
          <View className="items-center mb-6">
            <Text className="text-slate-500 text-sm">
              Don't have an account?{' '}
              <Link href="/(auth)/register">
                <Text className="text-primary-600 font-semibold">Create one</Text>
              </Link>
            </Text>
          </View>

          {/* Divider */}
          <View className="flex-row items-center gap-3 mb-6">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="text-slate-400 text-xs">or</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          {/* Guest button */}
          <Pressable
            className="border border-slate-200 rounded-xl py-4 items-center active:bg-slate-50"
            onPress={handleGuest}
            disabled={guestLoading}
          >
            {guestLoading ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <Text className="text-slate-600 font-semibold text-base">Try without an account</Text>
            )}
          </Pressable>
          <Text className="text-slate-400 text-xs text-center mt-2">
            Progress is saved locally on this device
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

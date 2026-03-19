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

export default function RegisterScreen() {
  const { signUp, upgradeGuest, signInWithGoogle, signInWithApple, isGuest, isLoading, error, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const canSubmit = displayName.trim().length > 0 && email.trim().length > 0 && password.length >= 6;
  const anyLoading = isLoading || googleLoading || appleLoading;

  async function handleRegister() {
    if (!canSubmit) return;
    try {
      if (isGuest) {
        await upgradeGuest(email.trim().toLowerCase(), password, displayName.trim());
      } else {
        await signUp(email.trim().toLowerCase(), password, displayName.trim());
      }
    } catch {
      // Error is already set in the store
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    setAppleLoading(true);
    try {
      await signInWithApple();
    } finally {
      setAppleLoading(false);
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
          <View className="items-center mb-8">
            <Text className="text-5xl mb-3">{isGuest ? '☁️' : '🌐'}</Text>
            <Text className="text-3xl font-bold text-slate-800">
              {isGuest ? 'Save your progress' : 'Create account'}
            </Text>
            <Text className="text-slate-500 text-base mt-2 text-center">
              {isGuest
                ? 'Your XP, streak, and progress will be synced across devices'
                : 'Start your language learning journey'}
            </Text>
          </View>

          {/* ── Social sign-in ── */}
          <View className="gap-3 mb-5">
            {/* Google */}
            <Pressable
              className="flex-row items-center justify-center gap-3 border border-slate-200 rounded-xl py-3.5 bg-white active:bg-slate-50"
              onPress={handleGoogle}
              disabled={anyLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <Text className="text-lg">G</Text>
              )}
              <Text className="text-slate-700 font-semibold text-base">
                {isGuest ? 'Save progress with Google' : 'Continue with Google'}
              </Text>
            </Pressable>

            {/* Apple — iOS only */}
            {Platform.OS === 'ios' ? (
              <Pressable
                className="flex-row items-center justify-center gap-3 bg-black rounded-xl py-3.5 active:opacity-80"
                onPress={handleApple}
                disabled={anyLoading}
              >
                {appleLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-lg"></Text>
                )}
                <Text className="text-white font-semibold text-base">
                  {isGuest ? 'Save progress with Apple' : 'Continue with Apple'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Divider */}
          <View className="flex-row items-center gap-3 mb-5">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="text-slate-400 text-xs font-medium">or with email</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          {/* Error */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="gap-3 mb-4">
            <View>
              <Text className="text-slate-600 text-sm font-medium mb-1.5">Name</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-base"
                placeholder="Your name"
                placeholderTextColor="#94A3B8"
                value={displayName}
                onChangeText={(t) => { setDisplayName(t); clearError(); }}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
            </View>

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
                returnKeyType="next"
              />
            </View>

            <View>
              <Text className="text-slate-600 text-sm font-medium mb-1.5">Password</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-base"
                placeholder="At least 6 characters"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                onSubmitEditing={handleRegister}
                returnKeyType="go"
              />
            </View>
          </View>

          {/* Submit button */}
          <Pressable
            className={`bg-primary-600 rounded-xl py-4 items-center justify-center flex-row gap-2 mb-6
              ${isLoading || !canSubmit ? 'opacity-60' : 'active:opacity-80'}`}
            onPress={handleRegister}
            disabled={isLoading || !canSubmit}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : null}
            <Text className="text-white font-bold text-base">
              {isLoading
                ? isGuest ? 'Saving…' : 'Creating account…'
                : isGuest ? 'Save & Sync Progress' : 'Create Account'}
            </Text>
          </Pressable>

          {/* Sign in link — only for non-guests */}
          {!isGuest ? (
            <View className="items-center">
              <Text className="text-slate-500 text-sm">
                Already have an account?{' '}
                <Link href="/(auth)/login">
                  <Text className="text-primary-600 font-semibold">Sign in</Text>
                </Link>
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

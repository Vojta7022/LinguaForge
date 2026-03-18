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
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = displayName.trim().length > 0 && email.trim().length > 0 && password.length >= 6;

  async function handleRegister() {
    if (!canSubmit) return;
    try {
      await signUp(email.trim().toLowerCase(), password, displayName.trim());
    } catch {
      // Error is already set in the store — nothing more to do here
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
            <Text className="text-3xl font-bold text-slate-800">Create account</Text>
            <Text className="text-slate-500 text-base mt-2 text-center">
              Start your language learning journey
            </Text>
          </View>

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

          {/* Error */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Sign up button */}
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
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Text>
          </Pressable>

          {/* Sign in link */}
          <View className="items-center">
            <Text className="text-slate-500 text-sm">
              Already have an account?{' '}
              <Link href="/(auth)/login">
                <Text className="text-primary-600 font-semibold">Sign in</Text>
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

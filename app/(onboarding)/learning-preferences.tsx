import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function LearningPreferencesScreen() {
  const { setLearningPreferences } = useOnboardingStore();
  const [interests, setInterests] = useState('');
  const [avoided, setAvoided] = useState('');

  function handleContinue() {
    setLearningPreferences(interests, avoided);
    router.push('/(onboarding)/placement-test');
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-slate-800 mb-1">
          What should your course talk about?
        </Text>
        <Text className="text-base text-slate-500 mb-8 leading-6">
          AI will plan your units around these topics, then generate lessons and exercises from that plan.
        </Text>

        <Text className="text-slate-700 font-semibold mb-2">Topics you like</Text>
        <TextInput
          className="min-h-28 rounded-2xl border-2 border-slate-200 px-4 py-3 text-base text-slate-800"
          multiline
          placeholder="e.g. technology, startups, politics, psychology, travel, literature"
          placeholderTextColor="#94A3B8"
          textAlignVertical="top"
          value={interests}
          onChangeText={setInterests}
        />

        <Text className="text-slate-700 font-semibold mt-6 mb-2">Topics to avoid</Text>
        <TextInput
          className="min-h-24 rounded-2xl border-2 border-slate-200 px-4 py-3 text-base text-slate-800"
          multiline
          placeholder="e.g. sports, celebrity gossip, finance"
          placeholderTextColor="#94A3B8"
          textAlignVertical="top"
          value={avoided}
          onChangeText={setAvoided}
        />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4">
        <Pressable
          className="rounded-xl py-4 items-center bg-primary-600 active:opacity-80"
          onPress={handleContinue}
        >
          <Text className="text-white font-bold text-base">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

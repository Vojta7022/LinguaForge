import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { LANGUAGE_FLAGS, LANGUAGE_NAMES, type SupportedLanguage } from '@/types/user';

const LANGUAGES = Object.keys(LANGUAGE_FLAGS) as SupportedLanguage[];

export default function SelectTargetScreen() {
  const { nativeLanguage, setTargetLanguage } = useOnboardingStore();
  const [selected, setSelected] = useState<SupportedLanguage | null>(null);

  function handleContinue() {
    if (!selected) return;
    setTargetLanguage(selected);
    router.push('/(onboarding)/placement-test');
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-slate-800 mb-1">Which language are you learning?</Text>
        <Text className="text-base text-slate-500 mb-8">
          Choose the language you want to master.
        </Text>

        <View className="flex-row flex-wrap gap-3">
          {LANGUAGES.filter((lang) => lang !== nativeLanguage).map((lang) => {
            const isSelected = selected === lang;
            return (
              <Pressable
                key={lang}
                className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl border-2
                  ${isSelected
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-slate-200 bg-white active:bg-slate-50'
                  }`}
                onPress={() => setSelected(lang)}
              >
                <Text className="text-2xl">{LANGUAGE_FLAGS[lang]}</Text>
                <Text className={`font-medium text-sm ${isSelected ? 'text-primary-700' : 'text-slate-700'}`}>
                  {LANGUAGE_NAMES[lang]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4">
        <Pressable
          className={`rounded-xl py-4 items-center ${selected ? 'bg-primary-600 active:opacity-80' : 'bg-slate-200'}`}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text className={`font-bold text-base ${selected ? 'text-white' : 'text-slate-400'}`}>
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

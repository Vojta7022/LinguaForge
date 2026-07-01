import { View, Text, Pressable } from 'react-native';
import * as Speech from 'expo-speech';
import type { SpeakingContent } from '@/types/exercise';

interface Props {
  content: SpeakingContent;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string) => void;
  isChecked: boolean;
}

export default function SpeakingExercise({
  content,
  selectedAnswer,
  onAnswerChange,
  isChecked,
}: Props) {
  function play() {
    Speech.speak(content.expected_phrase, { language: content.tts_locale });
  }

  return (
    <View className="flex-1">
      <View className="bg-sky-50 rounded-2xl border-2 border-sky-200 p-5 mb-5">
        <Text className="text-4xl mb-3">🎙️</Text>
        <Text className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-2">
          Say this aloud
        </Text>
        <Text className="text-slate-900 text-xl font-bold leading-8">{content.prompt_text}</Text>
        <Pressable className="bg-sky-600 rounded-xl px-4 py-3 self-start mt-4" onPress={play}>
          <Text className="text-white font-bold">Play model</Text>
        </Pressable>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <Text className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">
          Pronunciation focus
        </Text>
        <Text className="text-slate-700 text-base leading-6">{content.pronunciation_tip}</Text>
      </View>

      <Pressable
        disabled={isChecked}
        className={`rounded-2xl p-4 border-2 ${selectedAnswer ? 'bg-primary-50 border-primary-500' : 'bg-white border-slate-200'}`}
        onPress={() => onAnswerChange(content.expected_phrase)}
      >
        <Text className={`text-center font-bold ${selectedAnswer ? 'text-primary-700' : 'text-slate-600'}`}>
          I said it clearly
        </Text>
      </Pressable>
    </View>
  );
}

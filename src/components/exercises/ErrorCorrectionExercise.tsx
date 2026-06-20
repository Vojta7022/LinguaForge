import { View, Text, TextInput, Keyboard } from 'react-native';
import { useEffect } from 'react';
import type { ErrorCorrectionContent } from '@/types/exercise';

interface Props {
  content: ErrorCorrectionContent;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string) => void;
  isChecked: boolean;
  isCorrect?: boolean;
}

const CATEGORY_CHIP: Record<
  ErrorCorrectionContent['error_category'],
  { container: string; text: string; label: string }
> = {
  grammar:    { container: 'bg-blue-50',    text: 'text-blue-700',   label: 'Grammar' },
  vocabulary: { container: 'bg-purple-50',  text: 'text-purple-700', label: 'Vocabulary' },
  register:   { container: 'bg-amber-50',   text: 'text-amber-700',  label: 'Register' },
  spelling:   { container: 'bg-slate-100',  text: 'text-slate-600',  label: 'Spelling' },
};

export default function ErrorCorrectionExercise({
  content,
  selectedAnswer,
  onAnswerChange,
  isChecked,
  isCorrect,
}: Props) {
  const chip = CATEGORY_CHIP[content.error_category];

  useEffect(() => {
    if (isChecked) Keyboard.dismiss();
  }, [isChecked]);

  const inputBorder = isChecked ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white';

  return (
    <View className="flex-1">
      <Text className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-3">
        Find and fix the mistake
      </Text>

      {/* Error category badge */}
      <View className={`self-start rounded-full px-3 py-1 mb-3 ${chip.container}`}>
        <Text className={`text-xs font-semibold ${chip.text}`}>{chip.label}</Text>
      </View>

      {/* Incorrect sentence card */}
      <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
        <Text className="text-slate-800 text-lg font-medium leading-7">
          {content.incorrect_sentence}
        </Text>
      </View>

      {/* Corrected sentence input */}
      <TextInput
        className={`border-2 rounded-2xl px-4 py-3 text-base text-slate-800 min-h-[80px] ${inputBorder}`}
        placeholder="Type the corrected sentence…"
        placeholderTextColor="#94A3B8"
        value={selectedAnswer ?? ''}
        onChangeText={onAnswerChange}
        multiline
        textAlignVertical="top"
        autoCorrect={false}
        autoCapitalize="sentences"
        autoFocus
        editable={!isChecked}
      />

      {/* Explanation block — always shown after checking */}
      {isChecked ? (
        <View className="bg-slate-50 rounded-xl p-3 mt-3">
          <Text className="text-slate-600 text-sm leading-5">{content.error_explanation}</Text>
        </View>
      ) : null}

      {/* Correct sentence — only shown when wrong */}
      {isChecked && !isCorrect ? (
        <View className="bg-green-50 border border-green-200 rounded-xl p-3 mt-3">
          <Text className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">
            Correct sentence
          </Text>
          <Text className="text-green-800 text-base font-medium">{content.correct_sentence}</Text>
        </View>
      ) : null}
    </View>
  );
}

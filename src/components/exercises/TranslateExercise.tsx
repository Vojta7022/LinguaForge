import { View, Text, TextInput, Keyboard } from 'react-native';
import { useEffect } from 'react';
import type { TranslateContent } from '@/types/exercise';
import type { SupportedLanguage } from '@/types/user';
import { LANGUAGE_NAMES } from '@/types/user';

interface Props {
  content: TranslateContent;
  targetLanguage: SupportedLanguage;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string | null) => void;
  isChecked: boolean;
}

export default function TranslateExercise({
  content,
  targetLanguage,
  selectedAnswer,
  onAnswerChange,
  isChecked,
}: Props) {
  const nativeLangName =
    LANGUAGE_NAMES[content.source_language as SupportedLanguage] ?? content.source_language;
  const targetLangName = LANGUAGE_NAMES[targetLanguage];

  useEffect(() => {
    if (isChecked) Keyboard.dismiss();
  }, [isChecked]);

  const borderColor = isChecked ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white';

  return (
    <View className="flex-1">
      {/* Direction label */}
      <Text className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
        {nativeLangName} → {targetLangName}
      </Text>

      {/* Source text */}
      <View className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200">
        <Text className="text-slate-800 text-lg font-medium leading-7">
          {content.source_text}
        </Text>
        {content.context_note && !isChecked ? (
          <Text className="text-slate-400 text-xs italic mt-2">
            💡 {content.context_note}
          </Text>
        ) : null}
      </View>

      {/* Text input */}
      <TextInput
        className={`border-2 rounded-2xl px-4 py-3 text-base text-slate-800 min-h-[100px] ${borderColor}`}
        placeholder={`Write in ${targetLangName}…`}
        placeholderTextColor="#94A3B8"
        value={selectedAnswer ?? ''}
        onChangeText={(t) => onAnswerChange(t.length > 0 ? t : null)}
        multiline
        textAlignVertical="top"
        autoCorrect={false}
        autoCapitalize="sentences"
        editable={!isChecked}
      />

      {!isChecked && (selectedAnswer?.length ?? 0) > 0 ? (
        <Text className="text-slate-400 text-xs text-right mt-1">
          {selectedAnswer?.length} chars
        </Text>
      ) : null}

      {/* Reference answer and alternatives are shown in the feedback banner */}
    </View>
  );
}

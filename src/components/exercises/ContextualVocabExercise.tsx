import { View, Text, Pressable } from 'react-native';
import type { ContextualVocabContent } from '@/types/exercise';

interface Props {
  content: ContextualVocabContent;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string) => void;
  isChecked: boolean;
  isCorrect?: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export default function ContextualVocabExercise({
  content,
  selectedAnswer,
  onAnswerChange,
  isChecked,
  isCorrect,
}: Props) {
  function handleOption(option: string) {
    if (isChecked) return;
    onAnswerChange(option);
  }

  // Split context passage around the target word to bold each occurrence
  const passageParts = content.context_passage.split(content.target_word);

  return (
    <View className="flex-1">
      {/* Context passage card */}
      <Text className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
        Read the context
      </Text>
      <View className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-4 mb-4">
        <Text className="text-slate-800 text-base leading-6 flex-row flex-wrap">
          {passageParts.map((part, i) => (
            <Text key={i}>
              {part}
              {i < passageParts.length - 1 && (
                <Text className="font-bold text-primary-700">{content.target_word}</Text>
              )}
            </Text>
          ))}
        </Text>
      </View>

      {/* Question */}
      <Text className="text-slate-800 font-semibold text-base mt-4 mb-3">
        {content.question}
      </Text>

      {/* Options */}
      <View className="gap-3">
        {content.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const correctOption = content.options[content.correct_index];
          const isCorrectOption = isChecked && option === correctOption;
          const isWrongSelected = isChecked && selectedAnswer === option && option !== correctOption;

          return (
            <Pressable
              key={index}
              onPress={() => handleOption(option)}
              disabled={isChecked}
              className={`flex-row items-center gap-3 rounded-2xl p-4 border-2
                ${isCorrectOption
                  ? 'bg-green-50 border-green-500'
                  : isWrongSelected
                  ? 'bg-red-50 border-red-400'
                  : isSelected
                  ? 'bg-primary-50 border-primary-500'
                  : 'bg-white border-slate-200 active:border-slate-300'
                }`}
            >
              {/* Label badge */}
              <View
                className={`w-8 h-8 rounded-full items-center justify-center
                  ${isCorrectOption
                    ? 'bg-green-500'
                    : isWrongSelected
                    ? 'bg-red-400'
                    : isSelected
                    ? 'bg-primary-500'
                    : 'bg-slate-100'
                  }`}
              >
                <Text
                  className={`text-sm font-bold
                    ${isCorrectOption || isWrongSelected || isSelected ? 'text-white' : 'text-slate-500'}`}
                >
                  {isCorrectOption ? '✓' : isWrongSelected ? '✗' : OPTION_LABELS[index]}
                </Text>
              </View>

              {/* Option text */}
              <Text
                className={`flex-1 text-base font-medium
                  ${isCorrectOption
                    ? 'text-green-700'
                    : isWrongSelected
                    ? 'text-red-600'
                    : isSelected
                    ? 'text-primary-700'
                    : 'text-slate-700'
                  }`}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Word in context — shown only when checked and correct */}
      {isChecked && isCorrect && (
        <View className="bg-green-50 rounded-xl p-3 mt-3">
          <Text className="text-xs text-green-600 font-semibold mb-1">Used in context:</Text>
          <Text className="text-sm text-green-800">{content.word_in_context}</Text>
        </View>
      )}
    </View>
  );
}

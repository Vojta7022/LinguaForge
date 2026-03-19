import { View, Text, Pressable } from 'react-native';
import type { MultipleChoiceContent } from '@/types/exercise';

interface Props {
  content: MultipleChoiceContent;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string | null) => void;
  isChecked: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export default function MultipleChoiceExercise({
  content,
  selectedAnswer,
  onAnswerChange,
  isChecked,
}: Props) {
  function handleOption(index: number) {
    if (isChecked) return;
    const key = String(index);
    onAnswerChange(selectedAnswer === key ? null : key);
  }

  return (
    <View className="flex-1">
      {/* Question */}
      <Text className="text-slate-800 text-xl font-semibold leading-7 mb-6">
        {content.question}
      </Text>

      {/* Options */}
      <View className="gap-3">
        {content.options.map((option, index) => {
          const key = String(index);
          const isSelected = selectedAnswer === key;
          const isCorrectOption = isChecked && index === content.correct_index;
          const isWrongSelected = isChecked && isSelected && index !== content.correct_index;

          return (
            <Pressable
              key={index}
              onPress={() => handleOption(index)}
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
    </View>
  );
}

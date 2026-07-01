import { View, Text, Pressable } from 'react-native';
import type { DialogueContent } from '@/types/exercise';

interface Props {
  content: DialogueContent;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string) => void;
  isChecked: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export default function DialogueExercise({
  content,
  selectedAnswer,
  onAnswerChange,
  isChecked,
}: Props) {
  const correctOption = content.options[content.correct_index];

  return (
    <View className="flex-1">
      <Text className="text-slate-800 text-xl font-bold mb-4">{content.title}</Text>
      <View className="bg-violet-50 rounded-2xl border-2 border-violet-200 p-4 mb-5 gap-3">
        {content.turns.map((turn, index) => (
          <View key={`${turn.speaker}-${index}`} className="flex-row gap-3">
            <Text className="text-violet-700 font-bold w-16">{turn.speaker}</Text>
            <Text className="text-slate-800 flex-1 leading-6">{turn.line}</Text>
          </View>
        ))}
      </View>

      <Text className="text-slate-800 font-semibold text-base mb-3">{content.question}</Text>
      <View className="gap-3">
        {content.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = isChecked && option === correctOption;
          const isWrongSelected = isChecked && selectedAnswer === option && option !== correctOption;
          return (
            <Pressable
              key={option}
              disabled={isChecked}
              onPress={() => onAnswerChange(option)}
              className={`flex-row items-center gap-3 rounded-2xl p-4 border-2
                ${isCorrectOption ? 'bg-green-50 border-green-500'
                  : isWrongSelected ? 'bg-red-50 border-red-400'
                  : isSelected ? 'bg-primary-50 border-primary-500'
                  : 'bg-white border-slate-200 active:border-slate-300'}`}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center
                ${isCorrectOption ? 'bg-green-500'
                  : isWrongSelected ? 'bg-red-400'
                  : isSelected ? 'bg-primary-500'
                  : 'bg-slate-100'}`}
              >
                <Text className={`text-sm font-bold ${isCorrectOption || isWrongSelected || isSelected ? 'text-white' : 'text-slate-500'}`}>
                  {isCorrectOption ? '✓' : isWrongSelected ? '✗' : OPTION_LABELS[index]}
                </Text>
              </View>
              <Text className="flex-1 text-base font-medium text-slate-700">{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

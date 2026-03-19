import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';
import type { FillBlankContent } from '@/types/exercise';
import { shuffle } from '@/utils/exerciseHelpers';

interface Props {
  content: FillBlankContent;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string | null) => void;
  isChecked: boolean;
}

export default function FillBlankExercise({
  content,
  selectedAnswer,
  onAnswerChange,
  isChecked,
}: Props) {
  const shuffledBank = useMemo(() => shuffle([...content.word_bank]), [content.word_bank]);

  // Split sentence on ___ (take first blank only)
  const parts = content.sentence.split('___');
  const before = parts[0] ?? '';
  const after = parts[1] ?? '';

  function handleChip(word: string) {
    if (isChecked) return;
    onAnswerChange(selectedAnswer === word ? null : word);
  }

  return (
    <View className="flex-1">
      {/* Sentence with inline blank */}
      <Text className="text-slate-800 text-xl font-semibold leading-9 mb-6">
        {before}
        <Text
          className={
            selectedAnswer
              ? 'text-primary-600 font-bold'
              : 'text-slate-300'
          }
        >
          {selectedAnswer ? ` ${selectedAnswer} ` : ' _________ '}
        </Text>
        {after}
      </Text>

      {/* Grammar hint */}
      {content.grammar_hint ? (
        <Text className="text-slate-400 text-sm italic mb-5">
          💡 {content.grammar_hint}
        </Text>
      ) : null}

      {/* Word bank */}
      <View className="flex-row flex-wrap gap-3">
        {shuffledBank.map((word, index) => {
          const isSelected = selectedAnswer === word;
          const isCorrectWord = isChecked && word === content.correct_answer;
          const isWrongWord = isChecked && isSelected && word !== content.correct_answer;

          return (
            <Pressable
              key={`${word}-${index}`}
              onPress={() => handleChip(word)}
              disabled={isChecked}
              className={`rounded-2xl px-5 py-3 border-2
                ${isCorrectWord
                  ? 'bg-green-50 border-green-500'
                  : isWrongWord
                  ? 'bg-red-50 border-red-400'
                  : isSelected
                  ? 'bg-primary-50 border-primary-500'
                  : 'bg-white border-slate-200 active:border-slate-400'
                }`}
            >
              <Text
                className={`font-semibold text-base
                  ${isCorrectWord
                    ? 'text-green-700'
                    : isWrongWord
                    ? 'text-red-600'
                    : isSelected
                    ? 'text-primary-700'
                    : 'text-slate-700'
                  }`}
              >
                {word}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

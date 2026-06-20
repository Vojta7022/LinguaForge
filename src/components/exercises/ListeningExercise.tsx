import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Speech from 'expo-speech';
import type { ListeningContent } from '@/types/exercise';

interface Props {
  content: ListeningContent;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string) => void;
  isChecked: boolean;
  isCorrect?: boolean;
  autoPlay?: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export default function ListeningExercise({
  content,
  selectedAnswer,
  onAnswerChange,
  isChecked,
  isCorrect,
  autoPlay,
}: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  function speakText() {
    setIsSpeaking(true);
    Speech.speak(content.tts_text, {
      language: content.tts_locale,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  useEffect(() => {
    if (autoPlay !== false) {
      speakText();
    }
    return () => {
      Speech.stop();
    };
  }, []);

  function handleStop() {
    Speech.stop();
    setIsSpeaking(false);
  }

  function handleOption(option: string) {
    if (isChecked) return;
    onAnswerChange(option);
  }

  const correctOption = content.options[content.correct_index];

  return (
    <View className="flex-1">
      {/* Audio player card */}
      <View className="bg-primary-50 rounded-2xl border border-primary-200 p-6 items-center">
        <Text className="text-5xl text-center mb-4">🔊</Text>

        {isSpeaking ? (
          <Pressable
            onPress={handleStop}
            className="bg-slate-200 rounded-xl px-6 py-3"
          >
            <Text className="text-slate-700 font-semibold text-base">⏹ Stop</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={speakText}
            className="bg-primary-600 rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold text-base">▶ Play</Text>
          </Pressable>
        )}

        <Pressable onPress={speakText} className="mt-2">
          <Text className="text-primary-600 text-xs">Replay</Text>
        </Pressable>
      </View>

      {/* Question */}
      <Text className="text-slate-800 font-semibold text-base mt-5 mb-3">
        {content.question}
      </Text>

      {/* Options */}
      <View className="gap-3">
        {content.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
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

      {/* Transcript — shown when checked, incorrect, and transcript exists */}
      {isChecked && !isCorrect && content.transcript && (
        <View className="bg-slate-50 rounded-xl p-3 mt-3">
          <Text className="text-xs text-slate-500 font-semibold mb-1">Transcript:</Text>
          <Text className="text-sm text-slate-700">{content.transcript}</Text>
        </View>
      )}
    </View>
  );
}

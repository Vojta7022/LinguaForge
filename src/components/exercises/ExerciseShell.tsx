import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useState, useRef } from 'react';

import ProgressBar from '@/components/ui/ProgressBar';
import FillBlankExercise from './FillBlankExercise';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import TranslateExercise from './TranslateExercise';

import type { Exercise, FillBlankContent, MultipleChoiceContent, TranslateContent } from '@/types/exercise';
import type { SupportedLanguage } from '@/types/user';
import { getFeedback } from '@/utils/exerciseHelpers';

interface Props {
  exercise: Exercise;
  currentIndex: number;    // 0-based
  totalCount: number;
  targetLanguage: SupportedLanguage;
  onContinue: (isCorrect: boolean, answer: string, timeMs: number) => void;
  onClose: () => void;
}

export default function ExerciseShell({
  exercise,
  currentIndex,
  totalCount,
  targetLanguage,
  onContinue,
  onClose,
}: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isClose, setIsClose] = useState(false);
  const [feedback, setFeedback] = useState({ correctAnswerDisplay: '', explanation: '' });
  const startTimeRef = useRef(Date.now());

  const bannerY = useSharedValue(280);
  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerY.value }],
  }));

  function handleCheck() {
    if (!selectedAnswer) return;
    const result = getFeedback(exercise, selectedAnswer);
    setIsCorrect(result.isCorrect);
    setIsClose(result.isClose);
    setFeedback({
      correctAnswerDisplay: result.correctAnswerDisplay,
      explanation: result.explanation,
    });
    setIsChecked(true);

    bannerY.value = withSpring(0, { damping: 18, stiffness: 180 });

    if (result.isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleContinue() {
    onContinue(isCorrect, selectedAnswer!, Date.now() - startTimeRef.current);
  }

  const typeLabel = exercise.type.replace(/_/g, ' ');
  const progress = (currentIndex + 1) / totalCount;

  return (
    <View className="flex-1 bg-white">
      {/* Progress bar */}
      <View className="px-5 pt-14 pb-2">
        <ProgressBar progress={progress} />
      </View>

      {/* Header row */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={onClose} hitSlop={12}>
          <Text className="text-slate-400 text-2xl font-light">✕</Text>
        </Pressable>
        <Text className="text-slate-500 text-sm font-semibold">
          {currentIndex + 1} / {totalCount}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Exercise type label */}
      <View className="px-5 mb-1">
        <Text className="text-xs font-bold uppercase tracking-widest text-primary-500">
          {typeLabel}
        </Text>
      </View>

      {/* Scrollable exercise area */}
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-3">
          {exercise.type === 'FILL_BLANK' && (
            <FillBlankExercise
              content={exercise.content as FillBlankContent}
              selectedAnswer={selectedAnswer}
              onAnswerChange={setSelectedAnswer}
              isChecked={isChecked}
            />
          )}
          {exercise.type === 'MULTIPLE_CHOICE' && (
            <MultipleChoiceExercise
              content={exercise.content as MultipleChoiceContent}
              selectedAnswer={selectedAnswer}
              onAnswerChange={setSelectedAnswer}
              isChecked={isChecked}
            />
          )}
          {exercise.type === 'TRANSLATE' && (
            <TranslateExercise
              content={exercise.content as TranslateContent}
              targetLanguage={targetLanguage}
              selectedAnswer={selectedAnswer}
              onAnswerChange={setSelectedAnswer}
              isChecked={isChecked}
              isCorrect={isCorrect}
              isClose={isClose}
            />
          )}
          {!['FILL_BLANK', 'MULTIPLE_CHOICE', 'TRANSLATE'].includes(exercise.type) && (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-slate-400">Exercise type {exercise.type} coming soon</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Check button (hidden when checked — banner takes over) */}
      {!isChecked ? (
        <View className="px-5 pb-10 pt-2">
          <Pressable
            className={`rounded-2xl py-4 items-center
              ${selectedAnswer ? 'bg-primary-600 active:opacity-80' : 'bg-slate-200'}`}
            onPress={handleCheck}
            disabled={!selectedAnswer}
          >
            <Text className={`font-bold text-lg ${selectedAnswer ? 'text-white' : 'text-slate-400'}`}>
              Check
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Feedback banner — slides up from bottom */}
      <Animated.View
        style={[bannerStyle, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}
        className={`px-5 pt-5 pb-10 border-t-2
          ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
      >
        {/* Status line */}
        <Text className={`text-xl font-bold mb-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
          {isCorrect ? '✓ Correct!' : isClose ? '✗ Very close!' : '✗ Not quite'}
        </Text>

        {/* Correct answer (shown when wrong) */}
        {!isCorrect && feedback.correctAnswerDisplay ? (
          <Text className="text-slate-700 text-sm mb-1">
            <Text className="font-semibold">Correct: </Text>
            {feedback.correctAnswerDisplay}
          </Text>
        ) : null}

        {/* Explanation */}
        {feedback.explanation ? (
          <Text className="text-slate-600 text-sm mb-4 leading-5">
            {feedback.explanation}
          </Text>
        ) : (
          <View className="mb-4" />
        )}

        {/* Continue button */}
        <Pressable
          className={`rounded-2xl py-4 items-center active:opacity-80
            ${isCorrect ? 'bg-green-600' : 'bg-red-500'}`}
          onPress={handleContinue}
        >
          <Text className="text-white font-bold text-lg">Continue</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

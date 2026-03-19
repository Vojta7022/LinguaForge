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
import WordMatchExercise from './WordMatchExercise';
import WordBankTranslateExercise from './WordBankTranslateExercise';

import type {
  Exercise,
  FillBlankContent,
  MultipleChoiceContent,
  TranslateContent,
  WordMatchContent,
  WordBankTranslateContent,
} from '@/types/exercise';
import type { SupportedLanguage } from '@/types/user';
import { getFeedback } from '@/utils/exerciseHelpers';

interface Props {
  exercise: Exercise;
  currentIndex: number;    // 0-based
  totalCount: number;
  targetLanguage: SupportedLanguage;
  nativeLanguage: SupportedLanguage;
  onContinue: (isCorrect: boolean, answer: string, timeMs: number) => void;
  onClose: () => void;
}

export default function ExerciseShell({
  exercise,
  currentIndex,
  totalCount,
  targetLanguage,
  nativeLanguage,
  onContinue,
  onClose,
}: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isClose, setIsClose] = useState(false);
  const [feedback, setFeedback] = useState<{
    correctAnswerDisplay: string;
    explanation: string;
    altAnswers?: string[];
    distractorReason?: string;
  }>({ correctAnswerDisplay: '', explanation: '' });
  const startTimeRef = useRef(Date.now());

  const bannerY = useSharedValue(280);
  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerY.value }],
  }));

  // WORD_MATCH is self-completing — no Check button, no feedback banner
  const isSelfComplete = exercise.type === 'WORD_MATCH';

  function handleCheck() {
    if (!selectedAnswer) return;
    const result = getFeedback(exercise, selectedAnswer);
    setIsCorrect(result.isCorrect);
    setIsClose(result.isClose);
    setFeedback({
      correctAnswerDisplay: result.correctAnswerDisplay,
      explanation: result.explanation,
      altAnswers: result.altAnswers,
      distractorReason: result.distractorReason,
    });
    setIsChecked(true);

    bannerY.value = withSpring(0, { damping: 18, stiffness: 180 });

    if (result.isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleAutoComplete() {
    onContinue(true, 'matched', Date.now() - startTimeRef.current);
  }

  function handleContinue() {
    onContinue(isCorrect, selectedAnswer ?? '', Date.now() - startTimeRef.current);
  }

  const typeLabel = exercise.type.replace(/_/g, ' ');
  const progress = (currentIndex + 1) / totalCount;
  const bannerTitle = isCorrect
    ? (isClose ? '✓ Also acceptable!' : '✓ Correct!')
    : '✗ Not quite';

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
          {exercise.type === 'WORD_MATCH' && (
            <WordMatchExercise
              content={exercise.content as WordMatchContent}
              onComplete={handleAutoComplete}
            />
          )}
          {exercise.type === 'WORD_BANK_TRANSLATE' && (
            <WordBankTranslateExercise
              content={exercise.content as WordBankTranslateContent}
              nativeLanguage={nativeLanguage}
              selectedAnswer={selectedAnswer}
              onAnswerChange={setSelectedAnswer}
              isChecked={isChecked}
            />
          )}
          {!['FILL_BLANK', 'MULTIPLE_CHOICE', 'TRANSLATE', 'WORD_MATCH', 'WORD_BANK_TRANSLATE'].includes(exercise.type) && (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-slate-400">Exercise type {exercise.type} coming soon</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Check button — hidden for self-completing types or when already checked */}
      {!isChecked && !isSelfComplete ? (
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

      {/* Feedback banner — slides up from bottom (not used for WORD_MATCH) */}
      {!isSelfComplete ? (
        <Animated.View
          style={[bannerStyle, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}
          className={`px-5 pt-5 pb-10 border-t-2
            ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
        >
          {/* Status line */}
          <Text className={`text-xl font-bold mb-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
            {bannerTitle}
          </Text>

          {/* Correct answer (shown when wrong) */}
          {!isCorrect && feedback.correctAnswerDisplay ? (
            <Text className="text-slate-700 text-sm mb-1">
              <Text className="font-semibold">Correct: </Text>
              {feedback.correctAnswerDisplay}
            </Text>
          ) : null}

          {/* Why the chosen distractor was wrong (FILL_BLANK / MULTIPLE_CHOICE) */}
          {!isCorrect && feedback.distractorReason ? (
            <Text className="text-slate-500 text-xs italic mb-1 leading-5">
              {feedback.distractorReason}
            </Text>
          ) : null}

          {/* Grammar/context explanation */}
          {feedback.explanation ? (
            <Text className="text-slate-600 text-sm mb-2 leading-5">
              {feedback.explanation}
            </Text>
          ) : null}

          {/* Alternative translations (TRANSLATE only) */}
          {feedback.altAnswers && feedback.altAnswers.length > 0 ? (
            <View className="mb-2">
              <Text className="text-slate-500 text-xs font-semibold mb-1">Also accepted:</Text>
              {feedback.altAnswers.map((alt, i) => (
                <Text key={i} className="text-slate-600 text-xs leading-5">• {alt}</Text>
              ))}
            </View>
          ) : null}

          <View className="mb-3" />

          {/* Continue button */}
          <Pressable
            className={`rounded-2xl py-4 items-center active:opacity-80
              ${isCorrect ? 'bg-green-600' : 'bg-red-500'}`}
            onPress={handleContinue}
          >
            <Text className="text-white font-bold text-lg">Continue</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

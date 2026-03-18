import { useState, useCallback } from 'react';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useProgressStore } from '@/stores/progressStore';
import type { SM2Quality } from '@/types/srs';

/**
 * Hook for managing the current exercise interaction.
 * Handles answer submission, feedback display, and progression.
 */
export function useExercise() {
  const { current, advance } = useExerciseStore();
  const { recordAttempt } = useProgressStore();
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [startedAt] = useState(Date.now());

  const submit = useCallback(
    async (answer: string, correctAnswer: string) => {
      const correct = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      const timeMs = Date.now() - startedAt;

      setIsCorrect(correct);
      setAnswered(true);

      if (current) {
        await recordAttempt({
          user_id: 'local', // TODO: get from authStore
          exercise_id: current.id,
          is_correct: correct,
          answer_given: answer,
          time_spent_ms: timeMs,
          attempted_at: new Date().toISOString(),
        });
      }

      return correct;
    },
    [current, recordAttempt, startedAt],
  );

  const next = useCallback(() => {
    setAnswered(false);
    setIsCorrect(null);
    advance();
  }, [advance]);

  return {
    exercise: current,
    answered,
    isCorrect,
    submit,
    next,
  };
}

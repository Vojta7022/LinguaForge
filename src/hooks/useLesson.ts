import { useCallback } from 'react';
import { useLessonStore } from '@/stores/lessonStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useGamificationStore } from '@/stores/gamificationStore';

// TODO Phase 1: wire up to generateExercises() and AI engine

export function useLesson(lessonId: string) {
  const { activeSession, startSession, recordAnswer, completeSession } = useLessonStore();
  const { queue, currentIndex } = useExerciseStore();
  const { awardXP } = useGamificationStore();

  const progress = queue.length > 0 ? currentIndex / queue.length : 0;
  const isComplete = currentIndex >= queue.length && queue.length > 0;

  const begin = useCallback(
    (userId: string) => {
      startSession(lessonId, userId);
    },
    [lessonId, startSession],
  );

  const handleAnswer = useCallback(
    (isCorrect: boolean, level: 'B1' | 'B2' | 'C1' | 'C2' = 'B2') => {
      recordAnswer(isCorrect);
      if (isCorrect) {
        awardXP('correct_answer', level);
      }
    },
    [recordAnswer, awardXP],
  );

  const finish = useCallback(() => {
    completeSession();
    if (activeSession?.exercises_correct === activeSession?.exercises_answered) {
      awardXP('perfect_lesson', 'B2');
    }
  }, [completeSession, activeSession, awardXP]);

  return {
    session: activeSession,
    progress,
    isComplete,
    begin,
    handleAnswer,
    finish,
  };
}

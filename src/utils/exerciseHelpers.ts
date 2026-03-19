import type { Exercise, ExerciseContent, FillBlankContent, MultipleChoiceContent, TranslateContent } from '@/types/exercise';

/** Extracts the correct answer string from any exercise type */
export function getCorrectAnswer(exercise: Exercise): string {
  const c = exercise.content;
  switch (c.type) {
    case 'FILL_BLANK':         return c.correct_answer;
    case 'SENTENCE_REORDER':   return c.correct_sentence;
    case 'TRANSLATE':          return c.reference_translation;
    case 'MULTIPLE_CHOICE':    return c.options[c.correct_index];
    case 'ERROR_CORRECTION':   return c.correct_sentence;
    case 'CONTEXTUAL_VOCAB':   return c.options[c.correct_index];
    case 'LISTENING':          return c.options[c.correct_index];
    case 'CLOZE':              return c.blanks.map((b) => b.correct_answer).join(', ');
    case 'IDIOM_MATCH':        return c.correct_pairs.map(([i, m]) => `${c.idioms[i]}→${c.meanings[m]}`).join(', ');
    default:                   return '';
  }
}

/** Checks if a user's answer is acceptable for the given exercise (exact match) */
export function isAnswerCorrect(exercise: Exercise, answer: string): boolean {
  const c = exercise.content;
  const normalise = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:]$/g, '');
  const ans = normalise(answer);

  switch (c.type) {
    case 'FILL_BLANK':
      return [c.correct_answer, ...(c.acceptable_answers ?? [])].some((a) => normalise(a) === ans);
    case 'TRANSLATE':
      return [c.reference_translation, ...(c.acceptable_translations ?? [])].some((a) => normalise(a) === ans);
    case 'SENTENCE_REORDER':
      return normalise(c.correct_sentence) === ans;
    default:
      return normalise(getCorrectAnswer(exercise)) === ans;
  }
}

/** Shuffle array in place (Fisher-Yates) */
export function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Jaccard word-overlap similarity (0–1) between two strings */
export function wordJaccardSimilarity(a: string, b: string): number {
  const tok = (s: string) =>
    s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const sA = new Set(tok(a));
  const sB = new Set(tok(b));
  const intersection = [...sA].filter((w) => sB.has(w)).length;
  const union = new Set([...sA, ...sB]).size;
  return union === 0 ? 1 : intersection / union;
}

export interface AnswerFeedback {
  isCorrect: boolean;
  /** Text to show as the "correct answer" in the feedback banner */
  correctAnswerDisplay: string;
  /** Grammar hint / explanation text */
  explanation: string;
  /** For TRANSLATE: answer was within 70–90% similarity — "close but not quite" */
  isClose: boolean;
}

/**
 * Rich feedback for the ExerciseShell banner.
 * Handles TRANSLATE fuzzy matching (Jaccard ≥ 0.9 = correct, ≥ 0.7 = close).
 */
export function getFeedback(exercise: Exercise, answer: string): AnswerFeedback {
  const c = exercise.content;

  switch (c.type) {
    case 'FILL_BLANK': {
      return {
        isCorrect: isAnswerCorrect(exercise, answer),
        correctAnswerDisplay: c.correct_answer,
        explanation: c.grammar_hint ?? '',
        isClose: false,
      };
    }

    case 'MULTIPLE_CHOICE': {
      const idx = parseInt(answer, 10);
      return {
        isCorrect: idx === c.correct_index,
        correctAnswerDisplay: c.options[c.correct_index],
        explanation: c.explanation,
        isClose: false,
      };
    }

    case 'TRANSLATE': {
      const all = [c.reference_translation, ...c.acceptable_translations];
      const normalise = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:]/g, '');

      if (all.some((t) => normalise(t) === normalise(answer))) {
        return {
          isCorrect: true,
          correctAnswerDisplay: c.reference_translation,
          explanation: c.context_note ?? '',
          isClose: false,
        };
      }

      const maxSim = Math.max(...all.map((t) => wordJaccardSimilarity(answer, t)));
      return {
        isCorrect: maxSim >= 0.9,
        correctAnswerDisplay: c.reference_translation,
        explanation: c.context_note ?? '',
        isClose: maxSim >= 0.7 && maxSim < 0.9,
      };
    }

    default: {
      return {
        isCorrect: isAnswerCorrect(exercise, answer),
        correctAnswerDisplay: getCorrectAnswer(exercise),
        explanation: '',
        isClose: false,
      };
    }
  }
}

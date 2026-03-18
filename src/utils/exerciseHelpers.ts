import type { Exercise, ExerciseContent } from '@/types/exercise';

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

/** Checks if a user's answer is acceptable for the given exercise */
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

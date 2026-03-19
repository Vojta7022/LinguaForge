import type {
  Exercise,
  FillBlankContent,
  MultipleChoiceContent,
  TranslateContent,
  WordBankTranslateContent,
} from '@/types/exercise';

export function getCorrectAnswer(exercise: Exercise): string {
  const c = exercise.content;
  switch (c.type) {
    case 'FILL_BLANK':           return c.correct_answer;
    case 'SENTENCE_REORDER':     return c.correct_sentence;
    case 'TRANSLATE':            return c.reference_translation;
    case 'MULTIPLE_CHOICE':      return c.options[c.correct_index];
    case 'ERROR_CORRECTION':     return c.correct_sentence;
    case 'CONTEXTUAL_VOCAB':     return c.options[c.correct_index];
    case 'LISTENING':            return c.options[c.correct_index];
    case 'CLOZE':                return c.blanks.map((b) => b.correct_answer).join(', ');
    case 'IDIOM_MATCH':          return c.correct_pairs.map(([i, m]) => `${c.idioms[i]}→${c.meanings[m]}`).join(', ');
    case 'WORD_BANK_TRANSLATE':  return c.correct_sentence;
    case 'WORD_MATCH':           return 'matched';
    default:                     return '';
  }
}

export function isAnswerCorrect(exercise: Exercise, answer: string): boolean {
  const c = exercise.content;
  const norm = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:]$/g, '');
  const ans = norm(answer);

  switch (c.type) {
    case 'FILL_BLANK':
      return [c.correct_answer, ...(c.acceptable_answers ?? [])].some((a) => norm(a) === ans);
    case 'TRANSLATE':
      return [c.reference_translation, ...(c.acceptable_translations ?? [])].some((a) => norm(a) === ans);
    case 'SENTENCE_REORDER':
      return norm(c.correct_sentence) === ans;
    default:
      return norm(getCorrectAnswer(exercise)) === ans;
  }
}

/** Fisher-Yates shuffle (returns new array) */
export function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Jaccard word-overlap similarity [0–1] */
export function wordJaccardSimilarity(a: string, b: string): number {
  const tok = (s: string) =>
    s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const sA = new Set(tok(a));
  const sB = new Set(tok(b));
  const intersection = [...sA].filter((w) => sB.has(w)).length;
  const union = new Set([...sA, ...sB]).size;
  return union === 0 ? 1 : intersection / union;
}

function containsKeyWords(answer: string, keyWords: string[]): boolean {
  if (!keyWords || keyWords.length === 0) return true;
  const lower = answer.toLowerCase();
  return keyWords.every((kw) => lower.includes(kw.toLowerCase()));
}

export interface AnswerFeedback {
  isCorrect: boolean;
  correctAnswerDisplay: string;
  explanation: string;
  /** true = TRANSLATE scored correct but via fuzzy match — show "Also acceptable!" */
  isClose: boolean;
  /** Other valid translations shown after checking (TRANSLATE only) */
  altAnswers?: string[];
  /** Why the specific wrong choice was wrong (FILL_BLANK / MULTIPLE_CHOICE) */
  distractorReason?: string;
}

export function getFeedback(exercise: Exercise, answer: string): AnswerFeedback {
  const c = exercise.content;

  switch (c.type) {
    case 'FILL_BLANK': {
      const fb = c as FillBlankContent;
      const correct = isAnswerCorrect(exercise, answer);
      return {
        isCorrect: correct,
        correctAnswerDisplay: fb.correct_answer,
        explanation: fb.grammar_hint ?? '',
        isClose: false,
        distractorReason: !correct ? fb.distractor_reasons?.[answer] : undefined,
      };
    }

    case 'MULTIPLE_CHOICE': {
      const mc = c as MultipleChoiceContent;
      const idx = parseInt(answer, 10);
      const correct = idx === mc.correct_index;
      return {
        isCorrect: correct,
        correctAnswerDisplay: mc.options[mc.correct_index],
        explanation: mc.explanation,
        isClose: false,
        distractorReason: !correct ? mc.why_wrong?.[mc.options[idx]] : undefined,
      };
    }

    case 'TRANSLATE': {
      const tr = c as TranslateContent;
      const allAnswers = [tr.reference_translation, ...(tr.acceptable_translations ?? [])];
      const norm = (s: string) =>
        s.trim().toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');
      const alts = tr.acceptable_translations ?? [];

      // Exact match
      if (allAnswers.some((t) => norm(t) === norm(answer))) {
        return {
          isCorrect: true, isClose: false,
          correctAnswerDisplay: tr.reference_translation,
          explanation: tr.context_note ?? '',
          altAnswers: alts.length > 0 ? alts : undefined,
        };
      }

      const maxSim = Math.max(...allAnswers.map((t) => wordJaccardSimilarity(answer, t)));

      // High Jaccard → correct
      if (maxSim >= 0.85) {
        return {
          isCorrect: true, isClose: false,
          correctAnswerDisplay: tr.reference_translation,
          explanation: tr.context_note ?? '',
          altAnswers: alts.length > 0 ? alts : undefined,
        };
      }

      // Moderate Jaccard + key words → "also acceptable" (still correct)
      if (maxSim >= 0.6 && containsKeyWords(answer, tr.key_words ?? [])) {
        return {
          isCorrect: true, isClose: true,
          correctAnswerDisplay: tr.reference_translation,
          explanation: tr.context_note ?? '',
          altAnswers: alts.length > 0 ? alts : undefined,
        };
      }

      return {
        isCorrect: false, isClose: false,
        correctAnswerDisplay: tr.reference_translation,
        explanation: tr.context_note ?? '',
        altAnswers: alts.length > 0 ? alts : undefined,
      };
    }

    case 'WORD_BANK_TRANSLATE': {
      const wbt = c as WordBankTranslateContent;
      const norm = (s: string) =>
        s.trim().toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');
      const correct =
        norm(answer) === norm(wbt.correct_sentence) ||
        wordJaccardSimilarity(answer, wbt.correct_sentence) >= 0.85;
      return {
        isCorrect: correct,
        correctAnswerDisplay: wbt.correct_sentence,
        explanation: '', isClose: false,
      };
    }

    case 'WORD_MATCH':
      return { isCorrect: true, correctAnswerDisplay: '', explanation: '', isClose: false };

    default:
      return {
        isCorrect: isAnswerCorrect(exercise, answer),
        correctAnswerDisplay: getCorrectAnswer(exercise),
        explanation: '', isClose: false,
      };
  }
}

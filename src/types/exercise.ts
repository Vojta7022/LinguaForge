import { CEFRLevel, SupportedLanguage } from './user';

export type ExerciseType =
  | 'FILL_BLANK'
  | 'SENTENCE_REORDER'
  | 'TRANSLATE'
  | 'MULTIPLE_CHOICE'
  | 'ERROR_CORRECTION'
  | 'CLOZE'
  | 'IDIOM_MATCH'
  | 'CONTEXTUAL_VOCAB'
  | 'LISTENING'
  | 'WORD_MATCH'
  | 'WORD_BANK_TRANSLATE';

// ---------- Content shapes (type-discriminated union) ----------

export interface FillBlankContent {
  type: 'FILL_BLANK';
  sentence: string;
  word_bank: string[];
  correct_answer: string;
  acceptable_answers: string[];
  grammar_hint?: string;
  /** word → why that word is wrong (keyed by distractor text) */
  distractor_reasons?: Record<string, string>;
}

export interface SentenceReorderContent {
  type: 'SENTENCE_REORDER';
  words: string[];
  correct_sentence: string;
  grammar_note?: string;
}

export interface TranslateContent {
  type: 'TRANSLATE';
  source_text: string;
  source_language: SupportedLanguage;
  reference_translation: string;
  acceptable_translations: string[];
  /** Essential words that must appear in any correct answer */
  key_words?: string[];
  context_note?: string;
}

export interface MultipleChoiceContent {
  type: 'MULTIPLE_CHOICE';
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  explanation: string;
  /** option text → why that option is wrong */
  why_wrong?: Record<string, string>;
}

export interface ErrorCorrectionContent {
  type: 'ERROR_CORRECTION';
  incorrect_sentence: string;
  correct_sentence: string;
  error_explanation: string;
  error_category: 'grammar' | 'vocabulary' | 'register' | 'spelling';
}

export interface ClozeBlank {
  index: number;
  correct_answer: string;
  acceptable_answers: string[];
  word_bank: string[];
}

export interface ClozeContent {
  type: 'CLOZE';
  passage: string;
  blanks: ClozeBlank[];
}

export interface IdiomMatchContent {
  type: 'IDIOM_MATCH';
  idioms: string[];
  meanings: string[];
  correct_pairs: [number, number][];
}

export interface ContextualVocabContent {
  type: 'CONTEXTUAL_VOCAB';
  context_passage: string;
  target_word: string;
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  word_in_context: string;
}

export interface ListeningContent {
  type: 'LISTENING';
  tts_text: string;
  tts_locale: string;
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  transcript?: string;
}

export interface WordMatchContent {
  type: 'WORD_MATCH';
  /** 4–6 word pairs: target-language word + native-language translation */
  pairs: Array<{ target: string; native: string }>;
}

export interface WordBankTranslateContent {
  type: 'WORD_BANK_TRANSLATE';
  /** Sentence shown to the user (in the target language they are learning) */
  source_sentence: string;
  source_language: SupportedLanguage;
  /** Correct translation words in the right order (native language) */
  translated_words: string[];
  /** 2–3 extra tiles that don't belong in the translation */
  distractor_words: string[];
  /** Full correct native-language sentence (= translated_words joined) */
  correct_sentence: string;
}

export type ExerciseContent =
  | FillBlankContent
  | SentenceReorderContent
  | TranslateContent
  | MultipleChoiceContent
  | ErrorCorrectionContent
  | ClozeContent
  | IdiomMatchContent
  | ContextualVocabContent
  | ListeningContent
  | WordMatchContent
  | WordBankTranslateContent;

// ---------- Exercise entity ----------

export interface Exercise {
  id: string;
  lesson_id: string | null;
  type: ExerciseType;
  content: ExerciseContent;
  difficulty_score: number;
  language: SupportedLanguage;
  level: CEFRLevel;
  grammar_point: string | null;
  vocab_topic: string | null;
  times_shown: number;
  times_correct: number;
  is_cached: boolean;
  ai_model_used: 'groq' | 'gemini' | 'static';
  prompt_hash: string | null;
  generated_at: string;
  expires_at: string | null;
}

export const XP_BY_LEVEL: Record<CEFRLevel, number> = {
  B1: 10,
  B2: 12,
  C1: 15,
  C2: 20,
};

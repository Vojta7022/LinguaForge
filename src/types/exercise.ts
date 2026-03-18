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
  | 'LISTENING';

// ---------- Content shapes (type-discriminated union) ----------

export interface FillBlankContent {
  type: 'FILL_BLANK';
  sentence: string;            // "Es importante que ella ___ la verdad."
  word_bank: string[];         // includes correct + distractors
  correct_answer: string;
  acceptable_answers: string[];
  grammar_hint?: string;
}

export interface SentenceReorderContent {
  type: 'SENTENCE_REORDER';
  words: string[];             // shuffled word tokens
  correct_sentence: string;
  grammar_note?: string;
}

export interface TranslateContent {
  type: 'TRANSLATE';
  source_text: string;
  source_language: SupportedLanguage;
  reference_translation: string;
  acceptable_translations: string[];
  context_note?: string;
}

export interface MultipleChoiceContent {
  type: 'MULTIPLE_CHOICE';
  question: string;
  options: [string, string, string, string]; // always exactly 4
  correct_index: 0 | 1 | 2 | 3;
  explanation: string;
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
  passage: string;             // paragraph with ___ for each blank
  blanks: ClozeBlank[];
}

export interface IdiomMatchContent {
  type: 'IDIOM_MATCH';
  idioms: string[];
  meanings: string[];          // same length, shuffled
  correct_pairs: [number, number][]; // [idiom_index, meaning_index]
}

export interface ContextualVocabContent {
  type: 'CONTEXTUAL_VOCAB';
  context_passage: string;
  target_word: string;
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  word_in_context: string;     // excerpt highlighting the word
}

export interface ListeningContent {
  type: 'LISTENING';
  tts_text: string;            // text spoken by expo-speech
  tts_locale: string;          // e.g. 'es-ES'
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  transcript?: string;         // shown after answering
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
  | ListeningContent;

// ---------- Exercise entity ----------

export interface Exercise {
  id: string;
  lesson_id: string | null;
  type: ExerciseType;
  content: ExerciseContent;
  difficulty_score: number;    // 1-100 (B1≈25, B2≈50, C1≈75, C2≈95)
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
  expires_at: string | null;   // cached exercises expire after 7 days
}

export const XP_BY_LEVEL: Record<CEFRLevel, number> = {
  B1: 10,
  B2: 12,
  C1: 15,
  C2: 20,
};

import { z } from 'zod';
import type { ExerciseType } from '@/types/exercise';

// ---------- Content schemas ----------

export const FillBlankSchema = z.object({
  type: z.literal('FILL_BLANK'),
  sentence: z.string().min(5),
  word_bank: z.array(z.string()).min(2).max(8),
  correct_answer: z.string().min(1),
  acceptable_answers: z.array(z.string()),
  grammar_hint: z.string().optional(),
});

export const SentenceReorderSchema = z.object({
  type: z.literal('SENTENCE_REORDER'),
  words: z.array(z.string()).min(3),
  correct_sentence: z.string().min(5),
  grammar_note: z.string().optional(),
});

export const TranslateSchema = z.object({
  type: z.literal('TRANSLATE'),
  source_text: z.string().min(5),
  source_language: z.string(),
  reference_translation: z.string().min(3),
  acceptable_translations: z.array(z.string()),
  context_note: z.string().optional(),
});

export const MultipleChoiceSchema = z.object({
  type: z.literal('MULTIPLE_CHOICE'),
  question: z.string().min(5),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correct_index: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  explanation: z.string().min(10),
});

export const ErrorCorrectionSchema = z.object({
  type: z.literal('ERROR_CORRECTION'),
  incorrect_sentence: z.string().min(5),
  correct_sentence: z.string().min(5),
  error_explanation: z.string().min(10),
  error_category: z.enum(['grammar', 'vocabulary', 'register', 'spelling']),
});

export const ClozeSchema = z.object({
  type: z.literal('CLOZE'),
  passage: z.string().min(20),
  blanks: z.array(z.object({
    index: z.number().int().min(0),
    correct_answer: z.string().min(1),
    acceptable_answers: z.array(z.string()),
    word_bank: z.array(z.string()).min(2),
  })).min(1),
});

export const IdiomMatchSchema = z.object({
  type: z.literal('IDIOM_MATCH'),
  idioms: z.array(z.string()).min(2),
  meanings: z.array(z.string()).min(2),
  correct_pairs: z.array(z.tuple([z.number().int(), z.number().int()])),
});

export const ContextualVocabSchema = z.object({
  type: z.literal('CONTEXTUAL_VOCAB'),
  context_passage: z.string().min(20),
  target_word: z.string().min(1),
  question: z.string().min(5),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correct_index: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  word_in_context: z.string().min(5),
});

export const ListeningSchema = z.object({
  type: z.literal('LISTENING'),
  tts_text: z.string().min(10),
  tts_locale: z.string().min(2),
  question: z.string().min(5),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correct_index: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  transcript: z.string().optional(),
});

export const ExerciseContentSchema = z.discriminatedUnion('type', [
  FillBlankSchema,
  SentenceReorderSchema,
  TranslateSchema,
  MultipleChoiceSchema,
  ErrorCorrectionSchema,
  ClozeSchema,
  IdiomMatchSchema,
  ContextualVocabSchema,
  ListeningSchema,
]);

export const AIResponseSchema = z.object({
  exercises: z.array(z.object({
    content: ExerciseContentSchema,
    difficulty_score: z.number().int().min(1).max(100).optional(),
    grammar_point: z.string().nullable().optional(),
    vocab_topic: z.string().nullable().optional(),
  })).min(1),
});

export type ValidatedAIResponse = z.infer<typeof AIResponseSchema>;

/** Parse and validate raw AI JSON output. Throws ZodError if invalid. */
export function parseAIResponse(raw: string): ValidatedAIResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Try to extract JSON object from malformed response
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in AI response');
    parsed = JSON.parse(match[0]);
  }
  return AIResponseSchema.parse(parsed);
}

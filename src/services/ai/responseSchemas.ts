import { z } from 'zod';
import type { ExerciseContent } from '@/types/exercise';

// ─── Core content schemas (used as TS types elsewhere) ────────────────────

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

// ─── Metadata extension (flat — mixed into each exercise object) ──────────

const aiMetaSchema = z.object({
  difficulty_score: z.number().int().min(1).max(100).optional(),
  grammar_point: z.string().nullable().optional(),
  vocab_topic: z.string().nullable().optional(),
});

// ─── AI response schemas (content + metadata, all at top level) ───────────

const FillBlankAISchema = FillBlankSchema.merge(aiMetaSchema);
const SentenceReorderAISchema = SentenceReorderSchema.merge(aiMetaSchema);
const TranslateAISchema = TranslateSchema.merge(aiMetaSchema);
const MultipleChoiceAISchema = MultipleChoiceSchema.merge(aiMetaSchema);
const ErrorCorrectionAISchema = ErrorCorrectionSchema.merge(aiMetaSchema);
const ClozeAISchema = ClozeSchema.merge(aiMetaSchema);
const IdiomMatchAISchema = IdiomMatchSchema.merge(aiMetaSchema);
const ContextualVocabAISchema = ContextualVocabSchema.merge(aiMetaSchema);
const ListeningAISchema = ListeningSchema.merge(aiMetaSchema);

export const AIExerciseSchema = z.discriminatedUnion('type', [
  FillBlankAISchema,
  SentenceReorderAISchema,
  TranslateAISchema,
  MultipleChoiceAISchema,
  ErrorCorrectionAISchema,
  ClozeAISchema,
  IdiomMatchAISchema,
  ContextualVocabAISchema,
  ListeningAISchema,
]);

export const AIBatchResponseSchema = z.object({
  exercises: z.array(AIExerciseSchema).min(1),
});

export type AIExerciseRaw = z.infer<typeof AIExerciseSchema>;
export type AIBatchResponse = z.infer<typeof AIBatchResponseSchema>;

// ─── Parsing ──────────────────────────────────────────────────────────────

/**
 * Strips markdown fences, parses JSON, and validates the batch response.
 * Throws with a descriptive message on failure.
 */
export function parseAIBatch(raw: string): AIExerciseRaw[] {
  // Strip ``` code fences if present
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Attempt to extract a JSON object from a partially-wrapped response
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!objMatch) {
      throw new Error(`No JSON object found in AI response. Raw: ${cleaned.slice(0, 200)}`);
    }
    parsed = JSON.parse(objMatch[0]);
  }

  const result = AIBatchResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `AI response validation failed:\n${result.error.issues
        .map((i) => `  [${i.path.join('.')}] ${i.message}`)
        .join('\n')}\n\nRaw response (first 500 chars):\n${cleaned.slice(0, 500)}`,
    );
  }

  return result.data.exercises;
}

/**
 * Extracts just the content fields (drops AI metadata) from a raw exercise.
 * Safe cast: metadata fields were already stripped by destructuring.
 */
export function extractContent(raw: AIExerciseRaw): ExerciseContent {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { difficulty_score, grammar_point, vocab_topic, ...content } = raw;
  return content as unknown as ExerciseContent;
}

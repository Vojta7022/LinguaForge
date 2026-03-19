import { z } from 'zod';
import type { ExerciseContent } from '@/types/exercise';

// ─── Core content schemas ──────────────────────────────────────────────────

export const FillBlankSchema = z.object({
  type: z.literal('FILL_BLANK'),
  sentence: z.string().min(5),
  word_bank: z.array(z.string()).min(2).max(8),
  correct_answer: z.string().min(1),
  acceptable_answers: z.array(z.string()),
  grammar_hint: z.string().optional(),
  distractor_reasons: z.record(z.string(), z.string()).optional(),
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
  key_words: z.array(z.string()).optional(),
  context_note: z.string().optional(),
});

export const MultipleChoiceSchema = z.object({
  type: z.literal('MULTIPLE_CHOICE'),
  question: z.string().min(5),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correct_index: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  explanation: z.string().min(10),
  why_wrong: z.record(z.string(), z.string()).optional(),
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

export const WordMatchSchema = z.object({
  type: z.literal('WORD_MATCH'),
  pairs: z.array(z.object({
    target: z.string().min(1),
    native: z.string().min(1),
  })).min(4).max(6),
});

export const WordBankTranslateSchema = z.object({
  type: z.literal('WORD_BANK_TRANSLATE'),
  source_sentence: z.string().min(5),
  source_language: z.string(),
  translated_words: z.array(z.string().min(1)).min(3),
  distractor_words: z.array(z.string().min(1)).min(2).max(4),
  correct_sentence: z.string().min(3),
});

// ─── Metadata extension (merged flat into each exercise) ──────────────────

const aiMetaSchema = z.object({
  difficulty_score: z.number().int().min(1).max(100).optional(),
  grammar_point: z.string().nullable().optional(),
  vocab_topic: z.string().nullable().optional(),
});

// ─── AI response schemas ───────────────────────────────────────────────────

const FillBlankAISchema = FillBlankSchema.merge(aiMetaSchema);
const SentenceReorderAISchema = SentenceReorderSchema.merge(aiMetaSchema);
const TranslateAISchema = TranslateSchema.merge(aiMetaSchema);
const MultipleChoiceAISchema = MultipleChoiceSchema.merge(aiMetaSchema);
const ErrorCorrectionAISchema = ErrorCorrectionSchema.merge(aiMetaSchema);
const ClozeAISchema = ClozeSchema.merge(aiMetaSchema);
const IdiomMatchAISchema = IdiomMatchSchema.merge(aiMetaSchema);
const ContextualVocabAISchema = ContextualVocabSchema.merge(aiMetaSchema);
const ListeningAISchema = ListeningSchema.merge(aiMetaSchema);
const WordMatchAISchema = WordMatchSchema.merge(aiMetaSchema);
const WordBankTranslateAISchema = WordBankTranslateSchema.merge(aiMetaSchema);

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
  WordMatchAISchema,
  WordBankTranslateAISchema,
]);

export type AIExerciseRaw = z.infer<typeof AIExerciseSchema>;

// ─── Parsing ──────────────────────────────────────────────────────────────

/**
 * Strips markdown fences, parses JSON, validates each exercise individually.
 * Invalid items are skipped with a warning rather than failing the whole batch.
 * Throws only if no valid exercises survive.
 */
export function parseAIBatch(raw: string): AIExerciseRaw[] {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!objMatch) {
      throw new Error(`No JSON object found in AI response. Raw: ${cleaned.slice(0, 200)}`);
    }
    parsed = JSON.parse(objMatch[0]);
  }

  const outer = z.object({ exercises: z.array(z.unknown()).min(1) }).safeParse(parsed);
  if (!outer.success) {
    throw new Error(
      `AI response missing 'exercises' array.\nRaw (first 500 chars):\n${cleaned.slice(0, 500)}`,
    );
  }

  const valid: AIExerciseRaw[] = [];
  for (const [i, item] of outer.data.exercises.entries()) {
    const result = AIExerciseSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      const issues = result.error.issues
        .map((e) => `[${e.path.join('.')}] ${e.message}`)
        .join(', ');
      console.warn(`[AI] Exercise ${i} invalid, skipping: ${issues}`);
    }
  }

  if (valid.length === 0) {
    throw new Error(
      `No valid exercises in AI response (${outer.data.exercises.length} items all failed validation).`,
    );
  }

  return valid;
}

/**
 * Drops AI metadata fields, returning only the exercise content fields.
 */
export function extractContent(raw: AIExerciseRaw): ExerciseContent {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { difficulty_score, grammar_point, vocab_topic, ...content } = raw;
  return content as unknown as ExerciseContent;
}

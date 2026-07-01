import { z } from 'zod';
import type { ExerciseContent } from '@/types/exercise';

function normalizeExerciseType(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : String(item ?? '')))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function toReasonRecord(value: unknown): Record<string, string> | undefined {
  if (!value) return undefined;

  if (typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, reason]) => [key.trim(), String(reason ?? '').trim()] as const)
      .filter(([key, reason]) => key.length > 0 && reason.length > 0);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  if (!Array.isArray(value)) return undefined;

  const entries = value.flatMap((item): Array<[string, string]> => {
    if (typeof item === 'string') {
      const parts = item.split(/[:|-]/);
      if (parts.length >= 2) {
        const [key, ...rest] = parts;
        const reason = rest.join(':').trim();
        return key.trim() && reason ? [[key.trim(), reason]] : [];
      }
      return [];
    }

    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      const key =
        record.option ?? record.word ?? record.key ?? record.answer ?? record.text ?? record.choice;
      const reason =
        record.reason ?? record.explanation ?? record.value ?? record.message ?? record.why;

      if (typeof key === 'string' && typeof reason === 'string' && key.trim() && reason.trim()) {
        return [[key.trim(), reason.trim()]];
      }
    }

    return [];
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeExerciseItem(item: unknown): unknown {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return item;

  const record = { ...(item as Record<string, unknown>) };
  record.type = normalizeExerciseType(record.type);
  if (typeof record.correct_index === 'string' && /^\d+$/.test(record.correct_index)) {
    record.correct_index = Number(record.correct_index);
  }
  if (typeof record.difficulty_score === 'string' && /^\d+$/.test(record.difficulty_score)) {
    record.difficulty_score = Number(record.difficulty_score);
  }

  if (record.type === 'FILL_BLANK') {
    record.acceptable_answers = toStringArray(record.acceptable_answers);
    if (
      (!Array.isArray(record.acceptable_answers) || record.acceptable_answers.length === 0) &&
      typeof record.correct_answer === 'string'
    ) {
      record.acceptable_answers = [record.correct_answer];
    }
    const distractorReasons = toReasonRecord(record.distractor_reasons);
    if (distractorReasons) record.distractor_reasons = distractorReasons;
    else delete record.distractor_reasons;
  }

  if (record.type === 'MULTIPLE_CHOICE') {
    const whyWrong = toReasonRecord(record.why_wrong);
    if (whyWrong) record.why_wrong = whyWrong;
    else delete record.why_wrong;
  }

  if (record.type === 'TRANSLATE') {
    record.acceptable_translations = toStringArray(record.acceptable_translations);
    if (
      (!Array.isArray(record.acceptable_translations) || record.acceptable_translations.length === 0) &&
      typeof record.reference_translation === 'string'
    ) {
      record.acceptable_translations = [record.reference_translation];
    }
    record.key_words = toStringArray(record.key_words);
  }

  if (record.type === 'WORD_BANK_TRANSLATE') {
    record.translated_words = toStringArray(record.translated_words);
    record.distractor_words = toStringArray(record.distractor_words);
  }

  if (record.type === 'CLOZE' && Array.isArray(record.blanks)) {
    record.blanks = record.blanks.map((blank) => {
      if (!blank || typeof blank !== 'object') return blank;
      const b = { ...(blank as Record<string, unknown>) };
      b.acceptable_answers = toStringArray(b.acceptable_answers);
      if (
        (!Array.isArray(b.acceptable_answers) || b.acceptable_answers.length === 0) &&
        typeof b.correct_answer === 'string'
      ) {
        b.acceptable_answers = [b.correct_answer];
      }
      b.word_bank = toStringArray(b.word_bank);
      return b;
    });
  }

  if (record.type === 'IDIOM_MATCH') {
    record.idioms = toStringArray(record.idioms);
    record.meanings = toStringArray(record.meanings);
  }

  if (record.type === 'SENTENCE_REORDER') {
    record.words = toStringArray(record.words);
  }

  if (record.type === 'DIALOGUE' && Array.isArray(record.turns)) {
    record.turns = record.turns
      .filter((turn) => turn && typeof turn === 'object')
      .map((turn) => ({
        speaker: String((turn as Record<string, unknown>).speaker ?? '').trim(),
        line: String((turn as Record<string, unknown>).line ?? '').trim(),
      }))
      .filter((turn) => turn.speaker.length > 0 && turn.line.length > 0);
  }

  if (record.type === 'WORD_MATCH' && Array.isArray(record.pairs)) {
    record.pairs = record.pairs
      .filter((pair) => pair && typeof pair === 'object')
      .map((pair) => ({
        target: String((pair as Record<string, unknown>).target ?? '').trim(),
        native: String((pair as Record<string, unknown>).native ?? '').trim(),
      }))
      .filter((pair) => pair.target.length > 0 && pair.native.length > 0);
  }

  return record;
}

// ─── Core content schemas ──────────────────────────────────────────────────

export const FillBlankSchema = z.object({
  type: z.literal('FILL_BLANK'),
  sentence: z.string().min(5),
  word_bank: z.array(z.string()).min(2).max(8),
  correct_answer: z.string().min(1),
  acceptable_answers: z.array(z.string()).min(1),
  grammar_hint: z.string().optional(),
  distractor_reasons: z.record(z.string(), z.string()).optional(),
});

export const SentenceReorderSchema = z.object({
  type: z.literal('SENTENCE_REORDER'),
  native_sentence: z.string().optional(),
  words: z.array(z.string()).min(3),
  correct_sentence: z.string().min(5),
  grammar_note: z.string().optional(),
});

export const TranslateSchema = z.object({
  type: z.literal('TRANSLATE'),
  source_text: z.string().min(5),
  source_language: z.string(),
  reference_translation: z.string().min(3),
  acceptable_translations: z.array(z.string()).min(1),
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

export const SpeakingSchema = z.object({
  type: z.literal('SPEAKING'),
  prompt_text: z.string().min(5),
  tts_locale: z.string().min(2),
  expected_phrase: z.string().min(5),
  pronunciation_tip: z.string().min(5),
});

export const DialogueSchema = z.object({
  type: z.literal('DIALOGUE'),
  title: z.string().min(3),
  turns: z.array(z.object({
    speaker: z.string().min(1),
    line: z.string().min(3),
  })).min(2).max(8),
  question: z.string().min(5),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correct_index: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  explanation: z.string().min(10),
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
  direction: z.enum(['to_target', 'to_native']).optional(),
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
const SpeakingAISchema = SpeakingSchema.merge(aiMetaSchema);
const DialogueAISchema = DialogueSchema.merge(aiMetaSchema);
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
  SpeakingAISchema,
  DialogueAISchema,
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
    const result = AIExerciseSchema.safeParse(normalizeExerciseItem(item));
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

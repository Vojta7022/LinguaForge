import * as Network from 'expo-network';
import type { ExerciseType, Exercise } from '@/types/exercise';
import type { CEFRLevel, SupportedLanguage } from '@/types/user';
import { LANGUAGE_NAMES } from '@/types/user';
import { DIFFICULTY_PARAMS } from './difficultyScaler';
import { buildExercisePrompt, type ExerciseFocus } from './promptTemplates';
import { parseAIBatch, extractContent, type AIExerciseRaw } from './responseSchemas';
import { callGroqRaw } from './groqClient';
import { callGeminiRaw } from './geminiClient';
import {
  getCachedExercises,
  storeExerciseBatch,
  getStaleCachedExercises,
} from '@/repositories/cacheRepository';
import { saveExercises } from '@/repositories/exerciseRepository';

const BATCH_SIZE = 10;

// ─── Prompt hash ──────────────────────────────────────────────────────────

/** djb2 string hash — fast and sufficient for a local cache key */
function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

/**
 * Hash of type + language pair + level + topic + today's date.
 * Same request on the same day returns the same hash (cache hit).
 */
export function buildPromptHash(
  type: ExerciseType,
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  topic: string,
): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return djb2(`${type}:${language}:${nativeLanguage}:${level}:${topic}:${date}`);
}

// ─── Quality validation ────────────────────────────────────────────────────

/**
 * Runs lightweight post-parse quality checks.
 * Returns true if the exercise passes, false if it should be discarded.
 */
function validateExercise(raw: AIExerciseRaw): boolean {
  switch (raw.type) {
    case 'FILL_BLANK': {
      // Correct answer must be in word_bank
      const bankLower = raw.word_bank.map((w) => w.toLowerCase());
      if (!bankLower.includes(raw.correct_answer.toLowerCase())) {
        console.warn(
          `[Validate] FILL_BLANK: correct_answer "${raw.correct_answer}" not in word_bank [${raw.word_bank.join(', ')}]`,
        );
        return false;
      }
      // Correct answer must not appear in the sentence text outside the blank
      const sentenceWords = raw.sentence
        .replace(/___+/g, ' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (sentenceWords.includes(raw.correct_answer.toLowerCase())) {
        console.warn(
          `[Validate] FILL_BLANK: correct_answer "${raw.correct_answer}" already appears in sentence`,
        );
        return false;
      }
      return true;
    }

    case 'MULTIPLE_CHOICE': {
      if (raw.correct_index < 0 || raw.correct_index >= raw.options.length) {
        console.warn(
          `[Validate] MULTIPLE_CHOICE: correct_index ${raw.correct_index} out of range for ${raw.options.length} options`,
        );
        return false;
      }
      return true;
    }

    case 'WORD_MATCH': {
      const targets = raw.pairs.map((p) => p.target.toLowerCase());
      const natives = raw.pairs.map((p) => p.native.toLowerCase());
      if (new Set(targets).size !== targets.length || new Set(natives).size !== natives.length) {
        console.warn('[Validate] WORD_MATCH: duplicate words detected in pairs');
        return false;
      }
      return true;
    }

    case 'WORD_BANK_TRANSLATE': {
      // correct_sentence must equal translated_words joined
      const joined = raw.translated_words.join(' ');
      if (joined.toLowerCase() !== raw.correct_sentence.toLowerCase()) {
        console.warn(
          `[Validate] WORD_BANK_TRANSLATE: correct_sentence "${raw.correct_sentence}" ≠ translated_words joined "${joined}"`,
        );
        return false;
      }
      return true;
    }

    default:
      return true;
  }
}

// ─── Exercise builder ─────────────────────────────────────────────────────

function buildExercise(
  raw: AIExerciseRaw,
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  model: 'groq' | 'gemini',
  hash: string,
): Exercise {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 86_400_000).toISOString();
  const defaultScore = DIFFICULTY_PARAMS[level].score;

  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    lesson_id: null,
    type: raw.type,
    content: extractContent(raw),
    difficulty_score: raw.difficulty_score ?? defaultScore,
    language,
    level,
    grammar_point: raw.grammar_point ?? null,
    vocab_topic: raw.vocab_topic ?? null,
    times_shown: 0,
    times_correct: 0,
    is_cached: true,
    ai_model_used: model,
    prompt_hash: hash,
    generated_at: now.toISOString(),
    expires_at: expiresAt,
  };
}

// ─── Network check ────────────────────────────────────────────────────────

async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return true; // assume online if check fails
  }
}

// ─── Attempt one provider ─────────────────────────────────────────────────

async function attemptProvider(
  caller: (system: string, user: string) => Promise<string>,
  requestedType: ExerciseType,
  system: string,
  user: string,
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  model: 'groq' | 'gemini',
  hash: string,
): Promise<Exercise[]> {
  const raw = await caller(system, user);
  const allParsed = parseAIBatch(raw);

  // Filter to the requested type; AI sometimes returns mixed types
  const matching = allParsed.filter((r) => r.type === requestedType);
  if (matching.length < allParsed.length) {
    console.warn(
      `[AI] ${allParsed.length - matching.length} exercise(s) had wrong type ` +
      `(expected ${requestedType}), discarded`,
    );
  }

  // Quality validation
  const toValidate = matching.length > 0 ? matching : allParsed;
  const validated = toValidate.filter(validateExercise);
  const discardedCount = toValidate.length - validated.length;
  if (discardedCount > 0) {
    console.warn(`[Validate] Discarded ${discardedCount}/${toValidate.length} exercises failing quality checks`);
  }

  // If more than 50% failed validation, treat this attempt as a failure so the
  // caller falls through to the next provider (Groq → Gemini → stale cache)
  if (toValidate.length > 0 && validated.length < toValidate.length / 2) {
    throw new Error(
      `Quality check failed: ${discardedCount}/${toValidate.length} exercises discarded — trying next provider`,
    );
  }

  // Use validated exercises; fall back to unvalidated if nothing passed
  const toUse = validated.length > 0 ? validated : toValidate;
  return toUse.map((r) => buildExercise(r, language, nativeLanguage, level, model, hash));
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Main entry point for exercise generation.
 *
 * Priority chain:
 *   1. SQLite cache (exact hash, same-day)
 *   2. Groq (primary)
 *   3. Gemini (fallback)
 *   4. Stale SQLite cache (any age)
 *   5. Throws a user-friendly error
 *
 * @param focus  'vocabulary' | 'grammar' | 'mixed' (default 'mixed' = 70% vocab / 30% grammar)
 */
export async function generateExerciseBatch(
  type: ExerciseType,
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  topic: string,
  batchSize = BATCH_SIZE,
  focus: ExerciseFocus = 'mixed',
): Promise<Exercise[]> {
  const hash = buildPromptHash(type, language, nativeLanguage, level, topic);

  // 1. Fresh cache
  const cached = await getCachedExercises(hash);
  if (cached && cached.length > 0) {
    console.log('[AI] Cache hit:', hash);
    return cached;
  }

  // Skip API calls when offline
  const online = await isOnline();
  if (!online) {
    console.warn('[AI] Offline — falling back to stale cache');
    const stale = await getStaleCachedExercises(type, language, level);
    if (stale.length > 0) return stale;
    throw new Error(
      'You are offline and no cached exercises are available for this topic. ' +
      'Connect to the internet to generate new exercises.',
    );
  }

  const { system, user } = buildExercisePrompt(
    type, language, nativeLanguage, level, topic, batchSize, focus,
  );

  // 2. Groq
  try {
    const exercises = await attemptProvider(
      callGroqRaw, type, system, user, language, nativeLanguage, level, 'groq', hash,
    );
    await saveExercises(exercises);
    await storeExerciseBatch(hash, exercises);
    console.log(`[AI] Groq success: ${exercises.length} exercises`);
    return exercises;
  } catch (groqErr) {
    console.warn('[AI] Groq failed:', (groqErr as Error).message);
  }

  // 3. Gemini
  try {
    const exercises = await attemptProvider(
      callGeminiRaw, type, system, user, language, nativeLanguage, level, 'gemini', hash,
    );
    await saveExercises(exercises);
    await storeExerciseBatch(hash, exercises);
    console.log(`[AI] Gemini success: ${exercises.length} exercises`);
    return exercises;
  } catch (geminiErr) {
    console.warn('[AI] Gemini failed:', (geminiErr as Error).message);
  }

  // 4. Stale cache
  const stale = await getStaleCachedExercises(type, language, level);
  if (stale.length > 0) {
    console.warn('[AI] Using stale cache as last resort');
    return stale;
  }

  // 5. Give up
  throw new Error(
    'Unable to generate exercises right now. ' +
    'Both AI providers failed and no cached exercises are available. ' +
    'Please check your API keys and try again.',
  );
}

// ─── Lesson title generation ───────────────────────────────────────────────

/**
 * Asks the AI to generate a short, creative lesson title for the given topic/level.
 * Falls back to the topic string on any error.
 */
export async function generateLessonTitle(
  topic: string,
  level: CEFRLevel,
  language: SupportedLanguage,
): Promise<string> {
  const langName = LANGUAGE_NAMES[language];
  const system = 'You are a creative language course designer. Respond with ONLY valid JSON.';
  const user = `Generate a short, engaging lesson title (3-6 words) for a ${level} ${langName} lesson about "${topic}". Return JSON: {"title": "..."}`;

  try {
    const raw = await callGroqRaw(system, user);
    const cleaned = raw.trim().replace(/```(?:json)?\s*/g, '').replace(/```/g, '');
    const parsed = JSON.parse(cleaned) as { title?: string };
    const title = parsed.title?.trim();
    return title && title.length > 0 ? title : topic;
  } catch {
    return topic;
  }
}

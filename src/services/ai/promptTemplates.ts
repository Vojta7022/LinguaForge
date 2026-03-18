import type { AIGenerationRequest } from '@/types/api';
import type { ExerciseType } from '@/types/exercise';
import { LANGUAGE_NAMES, CEFR_DESCRIPTORS } from '@/types/user';

const SYSTEM_PROMPT = `You are an expert language teacher specializing in CEFR B2-C2 instruction.
You generate precise, culturally authentic exercises for advanced learners.
Always respond with valid JSON only. Never include markdown code fences.
Exercises must challenge advanced learners with nuanced grammar, idiomatic expressions,
and complex sentence structures that Duolingo does not cover.`;

/**
 * Builds the full prompt for an exercise generation request.
 * Each exercise type has its own instruction block and JSON schema example.
 */
export function buildPrompt(request: AIGenerationRequest): { system: string; user: string } {
  const languageName = LANGUAGE_NAMES[request.language];
  const nativeName = LANGUAGE_NAMES[request.native_language];
  const levelDesc = CEFR_DESCRIPTORS[request.difficulty];

  const user = `
Generate ${request.count} ${request.exercise_type} exercises in ${languageName}.
Learner's native language: ${nativeName}
CEFR level: ${request.difficulty} (${levelDesc})
Topic: ${request.topic}

${TYPE_INSTRUCTIONS[request.exercise_type]}

Return a JSON object: { "exercises": [ ...exerciseObjects ] }
Each exercise object must follow the schema for ${request.exercise_type} exactly.
`.trim();

  return { system: SYSTEM_PROMPT, user };
}

// TODO Phase 1: fill in detailed instructions + JSON schema examples for each type
const TYPE_INSTRUCTIONS: Record<ExerciseType, string> = {
  FILL_BLANK: `Each exercise: sentence with a single ___ blank.
Fields: { type: "FILL_BLANK", sentence, word_bank (4-6 items), correct_answer, acceptable_answers, grammar_hint? }`,

  SENTENCE_REORDER: `Each exercise: scrambled word tokens for one sentence.
Fields: { type: "SENTENCE_REORDER", words (shuffled), correct_sentence, grammar_note? }`,

  TRANSLATE: `Each exercise: source text to translate into target language.
Fields: { type: "TRANSLATE", source_text, source_language, reference_translation, acceptable_translations, context_note? }`,

  MULTIPLE_CHOICE: `Each exercise: question + 4 options (exactly).
Fields: { type: "MULTIPLE_CHOICE", question, options: [A,B,C,D], correct_index (0-3), explanation }`,

  ERROR_CORRECTION: `Each exercise: plausible learner error to identify and correct.
Fields: { type: "ERROR_CORRECTION", incorrect_sentence, correct_sentence, error_explanation, error_category }`,

  CLOZE: `Each exercise: paragraph with multiple ___ blanks.
Fields: { type: "CLOZE", passage, blanks: [{ index, correct_answer, acceptable_answers, word_bank }] }`,

  IDIOM_MATCH: `Each exercise: 4-6 idioms to match with their meanings.
Fields: { type: "IDIOM_MATCH", idioms, meanings (shuffled), correct_pairs: [[idiom_idx, meaning_idx]] }`,

  CONTEXTUAL_VOCAB: `Each exercise: passage with a target word in context.
Fields: { type: "CONTEXTUAL_VOCAB", context_passage, target_word, question, options: [A,B,C,D], correct_index, word_in_context }`,

  LISTENING: `Each exercise: text for TTS + comprehension question.
Fields: { type: "LISTENING", tts_text, tts_locale, question, options: [A,B,C,D], correct_index, transcript? }`,
};

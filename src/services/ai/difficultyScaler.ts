import type { CEFRLevel } from '@/types/user';

/**
 * Maps CEFR levels to numeric difficulty scores and prompt parameters.
 * Used when generating exercises to ensure appropriate challenge level.
 */
export interface DifficultyParams {
  score: number;         // 1-100
  vocabularyComplexity: 'common' | 'advanced' | 'nuanced' | 'literary';
  grammarComplexity: 'simple' | 'intermediate' | 'complex' | 'mastery';
  sentenceLength: 'short' | 'medium' | 'long' | 'very_long';
  abstractionLevel: 'concrete' | 'semi-abstract' | 'abstract' | 'highly_abstract';
}

export const DIFFICULTY_PARAMS: Record<CEFRLevel, DifficultyParams> = {
  B1: {
    score: 30,
    vocabularyComplexity: 'common',
    grammarComplexity: 'simple',
    sentenceLength: 'short',
    abstractionLevel: 'concrete',
  },
  B2: {
    score: 55,
    vocabularyComplexity: 'advanced',
    grammarComplexity: 'intermediate',
    sentenceLength: 'medium',
    abstractionLevel: 'semi-abstract',
  },
  C1: {
    score: 75,
    vocabularyComplexity: 'nuanced',
    grammarComplexity: 'complex',
    sentenceLength: 'long',
    abstractionLevel: 'abstract',
  },
  C2: {
    score: 95,
    vocabularyComplexity: 'literary',
    grammarComplexity: 'mastery',
    sentenceLength: 'very_long',
    abstractionLevel: 'highly_abstract',
  },
};

export function getDifficultyParams(level: CEFRLevel): DifficultyParams {
  return DIFFICULTY_PARAMS[level];
}

/** Returns a human-readable level description suitable for injection into AI prompts. */
export function getLevelInstruction(level: CEFRLevel): string {
  const map: Record<CEFRLevel, string> = {
    B1: 'common vocabulary and everyday contexts, present and past tenses, straightforward sentence structures. Avoid slang and literary language.',
    B2: 'abstract topics, complex conditionals, subjunctive mood, phrasal verbs, and advanced vocabulary. Contexts include professional, academic, and news settings.',
    C1: 'nuanced vocabulary with subtle semantic distinctions, complex grammatical structures, idiomatic expressions, and formal vs. informal register contrasts. Contexts include literary, academic, and specialised professional domains.',
    C2: 'literary language, rare grammatical constructions, culturally embedded references, subtle semantic distinctions between near-synonyms, and sophisticated discourse markers. Sentences should reflect authentic educated native-speaker usage.',
  };
  return map[level];
}

/** Returns the target difficulty_score range for a given level. */
export function getScoreRange(level: CEFRLevel): [number, number] {
  const ranges: Record<CEFRLevel, [number, number]> = {
    B1: [25, 45],
    B2: [46, 65],
    C1: [66, 82],
    C2: [83, 100],
  };
  return ranges[level];
}

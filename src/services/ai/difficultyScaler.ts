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

import type { CEFRLevel } from '@/types/user';

export interface LessonDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Used as the `topic` parameter for AI exercise generation */
  topic: string;
  unitTitle: string;
  /** Override the user's CEFR level for this lesson (used for Challenge mode) */
  levelOverride?: CEFRLevel;
}

export const LESSONS: LessonDefinition[] = [
  {
    id: 'subjunctive-mood',
    title: 'Subjunctive Mood',
    description: 'Nominal and adverbial subjunctive clauses',
    icon: '🌀',
    topic: 'Subjunctive Mood',
    unitTitle: 'Grammar Mastery',
  },
  {
    id: 'conditional-clauses',
    title: 'Conditionals & Hypothesis',
    description: 'Real, unreal, and mixed conditional sentences',
    icon: '❓',
    topic: 'Conditional Clauses and Hypothesis',
    unitTitle: 'Grammar Mastery',
  },
  {
    id: 'idioms-expressions',
    title: 'Idiomatic Expressions',
    description: 'High-frequency idioms used by native speakers',
    icon: '💬',
    topic: 'Idiomatic Expressions and Phrasal Verbs',
    unitTitle: 'Vocabulary & Style',
  },
  {
    id: 'passive-voice',
    title: 'Passive Voice Variations',
    description: 'Passive constructions across tenses and registers',
    icon: '🔄',
    topic: 'Passive Voice Variations',
    unitTitle: 'Grammar Mastery',
  },
  {
    id: 'discourse-markers',
    title: 'Discourse Markers',
    description: 'Linking ideas clearly in spoken and written text',
    icon: '📝',
    topic: 'Discourse Markers and Cohesive Devices',
    unitTitle: 'Academic Writing',
  },
  {
    id: 'register-formality',
    title: 'Register & Formality',
    description: 'Switching between formal, informal, and neutral register',
    icon: '🎩',
    topic: 'Register and Formality',
    unitTitle: 'Vocabulary & Style',
  },
];

/** CEFR level one step above the given level (caps at C2). */
const CEFR_LEVELS: CEFRLevel[] = ['B1', 'B2', 'C1', 'C2'];

export function bumpLevel(level: CEFRLevel): CEFRLevel {
  const idx = CEFR_LEVELS.indexOf(level);
  return CEFR_LEVELS[Math.min(idx + 1, CEFR_LEVELS.length - 1)];
}

/**
 * Resolves a lesson ID to a LessonDefinition.
 *
 * Handled patterns beyond the static list:
 *  - `challenge-{lessonId}` → same lesson but one CEFR level higher
 *  - `practice-{lessonId}` → same as the base lesson (practice run)
 */
export function getLessonById(id: string, userLevel?: CEFRLevel): LessonDefinition {
  // Direct match
  const found = LESSONS.find((l) => l.id === id);
  if (found) return found;

  // challenge-{lessonId}
  if (id.startsWith('challenge-')) {
    const baseId = id.slice('challenge-'.length);
    const base = LESSONS.find((l) => l.id === baseId) ?? LESSONS[0];
    return {
      ...base,
      id,
      title: `⚡ ${base.title}`,
      levelOverride: userLevel ? bumpLevel(userLevel) : 'C1',
    };
  }

  // practice-{lessonId}
  if (id.startsWith('practice-')) {
    const baseId = id.slice('practice-'.length);
    const base = LESSONS.find((l) => l.id === baseId) ?? LESSONS[0];
    return { ...base, id };
  }

  // Fallback
  return LESSONS[0];
}

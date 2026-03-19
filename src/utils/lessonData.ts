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

// ─── Infinite lesson topic pools ─────────────────────────────────────────

const TOPIC_ICONS: Record<string, string> = {
  'Travel & Culture': '✈️',
  'Work & Career': '💼',
  'Health & Wellbeing': '🏃',
  'Technology': '💻',
  'Environment': '🌍',
  'Social Issues': '🤝',
  'Education': '📚',
  'Food & Cuisine': '🍽️',
  'Entertainment': '🎬',
  'Relationships': '❤️',
  'Politics & Governance': '🏛️',
  'Philosophy & Ethics': '🤔',
  'Science': '🔬',
  'Art & Literature': '🎨',
  'Economics': '📈',
  'Law & Justice': '⚖️',
  'Psychology': '🧠',
  'Media & Journalism': '📰',
  'History': '📜',
  'Innovation': '💡',
  'Rhetoric & Persuasion': '🎤',
  'Literary Analysis': '📖',
  'Linguistics': '🔤',
  'Cultural Criticism': '🎭',
  'Academic Discourse': '🎓',
  'Satire & Irony': '😏',
  'Diplomatic Language': '🌐',
  'Regional Dialects': '🗣️',
  'Etymology': '🔠',
  'Translation Theory': '🔄',
};

const UNIT_BY_TOPIC: Record<string, string> = {
  'Travel & Culture': 'Real World',
  'Work & Career': 'Real World',
  'Health & Wellbeing': 'Real World',
  'Technology': 'Real World',
  'Environment': 'Real World',
  'Social Issues': 'Society',
  'Education': 'Society',
  'Food & Cuisine': 'Real World',
  'Entertainment': 'Real World',
  'Relationships': 'Real World',
  'Politics & Governance': 'Society',
  'Philosophy & Ethics': 'Advanced Thinking',
  'Science': 'Advanced Thinking',
  'Art & Literature': 'Culture',
  'Economics': 'Society',
  'Law & Justice': 'Society',
  'Psychology': 'Advanced Thinking',
  'Media & Journalism': 'Culture',
  'History': 'Culture',
  'Innovation': 'Advanced Thinking',
  'Rhetoric & Persuasion': 'Mastery',
  'Literary Analysis': 'Mastery',
  'Linguistics': 'Mastery',
  'Cultural Criticism': 'Mastery',
  'Academic Discourse': 'Mastery',
  'Satire & Irony': 'Mastery',
  'Diplomatic Language': 'Mastery',
  'Regional Dialects': 'Mastery',
  'Etymology': 'Mastery',
  'Translation Theory': 'Mastery',
};

export const TOPIC_POOLS: Record<CEFRLevel, string[]> = {
  B1: ['Travel & Culture', 'Work & Career', 'Health & Wellbeing', 'Technology',
       'Environment', 'Social Issues', 'Education', 'Food & Cuisine',
       'Entertainment', 'Relationships'],
  B2: ['Travel & Culture', 'Work & Career', 'Health & Wellbeing', 'Technology',
       'Environment', 'Social Issues', 'Education', 'Food & Cuisine',
       'Entertainment', 'Relationships'],
  C1: ['Politics & Governance', 'Philosophy & Ethics', 'Science', 'Art & Literature',
       'Economics', 'Law & Justice', 'Psychology', 'Media & Journalism',
       'History', 'Innovation'],
  C2: ['Rhetoric & Persuasion', 'Literary Analysis', 'Linguistics', 'Cultural Criticism',
       'Academic Discourse', 'Satire & Irony', 'Diplomatic Language', 'Regional Dialects',
       'Etymology', 'Translation Theory'],
};

/**
 * Generates up to `count` new LessonDefinition objects from the topic pool
 * for the given CEFR level, skipping any topics already used in `existingTopics`.
 */
export function generateMoreLessons(
  existingTopics: string[],
  level: CEFRLevel,
  count = 3,
  titleOverrides?: Record<string, string>,
): LessonDefinition[] {
  const pool = TOPIC_POOLS[level] ?? TOPIC_POOLS.B2;
  const used = new Set(existingTopics);
  const available = pool.filter((t) => !used.has(t));

  // Cycle back to beginning if all topics used
  const source = available.length >= count ? available : [...available, ...pool];

  const result: LessonDefinition[] = [];
  for (let i = 0; i < Math.min(count, source.length); i++) {
    const topic = source[i % source.length];
    const id = `generated-${topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    result.push({
      id,
      title: titleOverrides?.[topic] ?? topic,
      description: `Vocabulary and expressions for ${topic.toLowerCase()}`,
      icon: TOPIC_ICONS[topic] ?? '📖',
      topic,
      unitTitle: UNIT_BY_TOPIC[topic] ?? 'Advanced Topics',
    });
  }
  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

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
 *  - `generated-{slug}` → look up in provided extra lessons array
 */
export function getLessonById(
  id: string,
  userLevel?: CEFRLevel,
  extraLessons: LessonDefinition[] = [],
): LessonDefinition {
  // Direct match (static or generated)
  const all = [...LESSONS, ...extraLessons];
  const found = all.find((l) => l.id === id);
  if (found) return found;

  // challenge-{lessonId}
  if (id.startsWith('challenge-')) {
    const baseId = id.slice('challenge-'.length);
    const base = all.find((l) => l.id === baseId) ?? LESSONS[0];
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
    const base = all.find((l) => l.id === baseId) ?? LESSONS[0];
    return { ...base, id };
  }

  // Fallback
  return LESSONS[0];
}

import type {
  CourseRoadmap,
  LessonDefinition,
  LessonKind,
  RoadmapUnitDefinition,
} from '@/types/lesson';
import type { CEFRLevel, SupportedLanguage } from '@/types/user';

const TOPIC_ICONS: Record<string, string> = {
  'Travel & Culture': '✈️',
  'Work & Career': '💼',
  'Health & Wellbeing': '🏃',
  Technology: '💻',
  Environment: '🌍',
  'Social Issues': '🤝',
  Education: '📚',
  'Food & Cuisine': '🍽️',
  Entertainment: '🎬',
  Relationships: '❤️',
  'Politics & Governance': '🏛️',
  'Philosophy & Ethics': '🤔',
  Science: '🔬',
  'Art & Literature': '🎨',
  Economics: '📈',
  'Law & Justice': '⚖️',
  Psychology: '🧠',
  'Media & Journalism': '📰',
  History: '📜',
  Innovation: '💡',
  'Rhetoric & Persuasion': '🎤',
  'Literary Analysis': '📖',
  Linguistics: '🔤',
  'Cultural Criticism': '🎭',
  'Academic Discourse': '🎓',
  'Satire & Irony': '😏',
  'Diplomatic Language': '🌐',
  'Regional Dialects': '🗣️',
  Etymology: '🔠',
  'Translation Theory': '🔄',
};

const LESSON_KIND_META: Record<LessonKind, { icon: string; focusLabel: string }> = {
  new_vocabulary: { icon: '🧩', focusLabel: 'New words' },
  new_grammar: { icon: '📘', focusLabel: 'Grammar' },
  skill_practice: { icon: '🎯', focusLabel: 'Practice' },
  review: { icon: '🔁', focusLabel: 'Review' },
};

const UNIT_BY_TOPIC: Record<string, string> = {
  'Travel & Culture': 'Real World',
  'Work & Career': 'Real World',
  'Health & Wellbeing': 'Real World',
  Technology: 'Real World',
  Environment: 'Real World',
  'Social Issues': 'Society',
  Education: 'Society',
  'Food & Cuisine': 'Real World',
  Entertainment: 'Real World',
  Relationships: 'Real World',
  'Politics & Governance': 'Society',
  'Philosophy & Ethics': 'Advanced Thinking',
  Science: 'Advanced Thinking',
  'Art & Literature': 'Culture',
  Economics: 'Society',
  'Law & Justice': 'Society',
  Psychology: 'Advanced Thinking',
  'Media & Journalism': 'Culture',
  History: 'Culture',
  Innovation: 'Advanced Thinking',
  'Rhetoric & Persuasion': 'Mastery',
  'Literary Analysis': 'Mastery',
  Linguistics: 'Mastery',
  'Cultural Criticism': 'Mastery',
  'Academic Discourse': 'Mastery',
  'Satire & Irony': 'Mastery',
  'Diplomatic Language': 'Mastery',
  'Regional Dialects': 'Mastery',
  Etymology: 'Mastery',
  'Translation Theory': 'Mastery',
};

const GRAMMAR_POOLS: Record<CEFRLevel, string[]> = {
  B1: [
    'past vs present narration',
    'modal verbs for obligation',
    'future plans and intentions',
    'comparatives and intensifiers',
    'pronoun placement',
  ],
  B2: [
    'conditionals and hypothesis',
    'subjunctive triggers',
    'relative clauses',
    'passive voice',
    'discourse markers',
    'register shifts',
  ],
  C1: [
    'hedging and stance markers',
    'advanced connectors',
    'reported speech nuance',
    'nominalization',
    'inversion for emphasis',
    'precision with aspect',
  ],
  C2: [
    'rhetorical inversion',
    'register-sensitive ellipsis',
    'subtle mood choices',
    'literary sentence rhythm',
    'advanced clause compression',
    'discourse-level cohesion',
  ],
};

const VOCABULARY_POOLS: Record<CEFRLevel, string[]> = {
  B1: ['everyday verbs', 'high-frequency nouns', 'time phrases', 'opinions', 'descriptions'],
  B2: ['collocations', 'abstract nouns', 'workplace phrases', 'discussion language', 'connectors'],
  C1: ['nuanced synonyms', 'formal phrasing', 'idiomatic bundles', 'stance verbs', 'precision verbs'],
  C2: ['literary phrasing', 'rhetorical vocabulary', 'rare collocations', 'subtle contrasts', 'register cues'],
};

export const TOPIC_POOLS: Record<CEFRLevel, string[]> = {
  B1: [
    'Travel & Culture',
    'Work & Career',
    'Health & Wellbeing',
    'Technology',
    'Environment',
    'Social Issues',
    'Education',
    'Food & Cuisine',
    'Entertainment',
    'Relationships',
  ],
  B2: [
    'Travel & Culture',
    'Work & Career',
    'Health & Wellbeing',
    'Technology',
    'Environment',
    'Social Issues',
    'Education',
    'Food & Cuisine',
    'Entertainment',
    'Relationships',
  ],
  C1: [
    'Politics & Governance',
    'Philosophy & Ethics',
    'Science',
    'Art & Literature',
    'Economics',
    'Law & Justice',
    'Psychology',
    'Media & Journalism',
    'History',
    'Innovation',
  ],
  C2: [
    'Rhetoric & Persuasion',
    'Literary Analysis',
    'Linguistics',
    'Cultural Criticism',
    'Academic Discourse',
    'Satire & Irony',
    'Diplomatic Language',
    'Regional Dialects',
    'Etymology',
    'Translation Theory',
  ],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function lessonIcon(kind: LessonKind, topic: string): string {
  if (kind === 'review') return LESSON_KIND_META.review.icon;
  if (kind === 'skill_practice') return LESSON_KIND_META.skill_practice.icon;
  if (kind === 'new_grammar') return LESSON_KIND_META.new_grammar.icon;
  return TOPIC_ICONS[topic] ?? LESSON_KIND_META.new_vocabulary.icon;
}

export function getTopicIcon(topic: string): string {
  return TOPIC_ICONS[topic] ?? '📚';
}

function grammarFocusFor(level: CEFRLevel, unitIndex: number): string[] {
  const pool = GRAMMAR_POOLS[level];
  return [pool[unitIndex % pool.length], pool[(unitIndex + 2) % pool.length]];
}

function vocabularyFocusFor(level: CEFRLevel, topic: string, unitIndex: number): string[] {
  const pool = VOCABULARY_POOLS[level];
  return [
    topic.toLowerCase(),
    pool[unitIndex % pool.length],
    pool[(unitIndex + 2) % pool.length],
  ];
}

function canDoStatements(topic: string): string[] {
  return [
    `Talk about ${topic.toLowerCase()} with more natural phrasing.`,
    `Ask follow-up questions and respond with detail.`,
    'Recycle the same ideas in short review rounds.',
  ];
}

function buildFallbackUnit(
  topic: string,
  unitIndex: number,
  level: CEFRLevel,
): { unit: RoadmapUnitDefinition; lessons: LessonDefinition[] } {
  const unitId = `unit-${unitIndex + 1}-${slugify(topic)}`;
  const grammarFocus = grammarFocusFor(level, unitIndex);
  const vocabularyFocus = vocabularyFocusFor(level, topic, unitIndex);
  const canDo = canDoStatements(topic);
  const unitTitle = `Unit ${unitIndex + 1}: ${topic}`;
  const unitIcon = TOPIC_ICONS[topic] ?? '📚';

  const lessons: LessonDefinition[] = [
    {
      id: `${unitId}-vocab`,
      unitId,
      unitTitle,
      unitIndex,
      lessonIndex: 0,
      title: `${topic.split('&')[0].trim()} Words`,
      description: `Learn the core vocabulary for ${topic.toLowerCase()}.`,
      icon: lessonIcon('new_vocabulary', topic),
      topic,
      lessonKind: 'new_vocabulary',
      skillType: 'vocabulary',
      focusLabel: LESSON_KIND_META.new_vocabulary.focusLabel,
      objective: `Pick up the words and phrases you need to talk about ${topic.toLowerCase()}.`,
      grammarFocus,
      vocabularyFocus,
      canDo,
    },
    {
      id: `${unitId}-grammar`,
      unitId,
      unitTitle,
      unitIndex,
      lessonIndex: 1,
      title: `Grammar: ${grammarFocus[0]}`,
      description: `Use ${grammarFocus[0]} naturally inside the same topic.`,
      icon: lessonIcon('new_grammar', topic),
      topic: `${topic} with ${grammarFocus[0]}`,
      lessonKind: 'new_grammar',
      skillType: 'grammar',
      focusLabel: LESSON_KIND_META.new_grammar.focusLabel,
      objective: `Practice ${grammarFocus[0]} with ${topic.toLowerCase()} examples.`,
      grammarFocus,
      vocabularyFocus,
      canDo,
    },
    {
      id: `${unitId}-practice`,
      unitId,
      unitTitle,
      unitIndex,
      lessonIndex: 2,
      title: `${topic.split('&')[0].trim()} Practice`,
      description: 'Mix the new words and grammar into fast, focused drills.',
      icon: lessonIcon('skill_practice', topic),
      topic: `${topic} practice`,
      lessonKind: 'skill_practice',
      skillType: 'mixed',
      focusLabel: LESSON_KIND_META.skill_practice.focusLabel,
      objective: `Use the new material from ${topic.toLowerCase()} without hints.`,
      grammarFocus,
      vocabularyFocus,
      canDo,
    },
    {
      id: `${unitId}-review`,
      unitId,
      unitTitle,
      unitIndex,
      lessonIndex: 3,
      title: `${topic.split('&')[0].trim()} Review`,
      description: 'Review the unit before moving forward.',
      icon: lessonIcon('review', topic),
      topic: `${topic} review`,
      lessonKind: 'review',
      skillType: 'mixed',
      focusLabel: LESSON_KIND_META.review.focusLabel,
      objective: `Recall the vocabulary and patterns from this unit quickly and accurately.`,
      grammarFocus,
      vocabularyFocus,
      canDo,
    },
  ];

  return {
    unit: {
      id: unitId,
      title: unitTitle,
      description: `A Duolingo-style run through ${topic.toLowerCase()} with new words, grammar, practice, and review.`,
      icon: unitIcon,
      orderIndex: unitIndex,
      theme: UNIT_BY_TOPIC[topic] ?? 'Advanced Topics',
      level,
      lessonIds: lessons.map((lesson) => lesson.id),
      grammarFocus,
      vocabularyFocus,
      canDo,
    },
    lessons,
  };
}

export function buildFallbackRoadmap(
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
): CourseRoadmap {
  const topics = TOPIC_POOLS[level] ?? TOPIC_POOLS.B2;
  const units = topics.slice(0, 10).map((topic, index) => buildFallbackUnit(topic, index, level));

  return {
    id: `fallback-${language}-${nativeLanguage}-${level}`,
    title: `${level} Roadmap`,
    summary: 'A fallback roadmap with clear unit goals, a short guidebook, and a vocabulary/grammar/review rhythm.',
    language,
    nativeLanguage,
    level,
    units: units.map((entry) => entry.unit),
    lessons: units.flatMap((entry) => entry.lessons),
    generatedAt: new Date(0).toISOString(),
    expiresAt: null,
    source: 'fallback',
  };
}

const DEFAULT_ROADMAP = buildFallbackRoadmap('es', 'en', 'B2');

export const LESSONS: LessonDefinition[] = DEFAULT_ROADMAP.lessons;

const CEFR_LEVELS: CEFRLevel[] = ['B1', 'B2', 'C1', 'C2'];

export function bumpLevel(level: CEFRLevel): CEFRLevel {
  const idx = CEFR_LEVELS.indexOf(level);
  return CEFR_LEVELS[Math.min(idx + 1, CEFR_LEVELS.length - 1)];
}

export function getLessonById(
  id: string,
  userLevel?: CEFRLevel,
  lessons: LessonDefinition[] = LESSONS,
): LessonDefinition {
  const found = lessons.find((lesson) => lesson.id === id);
  if (found) return found;

  if (id.startsWith('challenge-')) {
    const baseId = id.slice('challenge-'.length);
    const base = lessons.find((lesson) => lesson.id === baseId) ?? lessons[0];
    return {
      ...base,
      id,
      title: `⚡ ${base.title}`,
      focusLabel: 'Challenge',
      description: `A harder pass through ${base.title.toLowerCase()}.`,
      levelOverride: userLevel ? bumpLevel(userLevel) : 'C1',
    };
  }

  if (id.startsWith('practice-')) {
    const baseId = id.slice('practice-'.length);
    const base = lessons.find((lesson) => lesson.id === baseId) ?? lessons[0];
    return {
      ...base,
      id,
      title: `Practice: ${base.title}`,
      focusLabel: 'Practice',
      description: `Redo ${base.title.toLowerCase()} with fresh exercises.`,
    };
  }

  return lessons[0];
}

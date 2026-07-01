import * as Network from 'expo-network';
import { getCachedRoadmap, storeRoadmap } from '@/repositories/roadmapRepository';
import { buildFallbackRoadmap, getTopicIcon } from '@/utils/lessonData';
import type { CourseRoadmap } from '@/types/lesson';
import type { CEFRLevel, SupportedLanguage } from '@/types/user';
import { callGroqRaw } from './groqClient';
import { callGeminiRaw } from './geminiClient';
import { buildRoadmapPrompt } from './promptTemplates';
import { parseRoadmapResponse } from './roadmapSchemas';

function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function buildRoadmapCacheKey(
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  learningInterests?: string | null,
  avoidedTopics?: string | null,
): string {
  return djb2(`roadmap:v4:${language}:${nativeLanguage}:${level}:${learningInterests ?? ''}:${avoidedTopics ?? ''}`);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const roadmapInFlight = new Map<string, Promise<CourseRoadmap>>();

async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return true;
  }
}

function buildRoadmapFromAI(
  raw: string,
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  cacheKey: string,
  learningInterests?: string | null,
  avoidedTopics?: string | null,
): CourseRoadmap {
  const parsed = parseRoadmapResponse(raw);
  const fallbackRoadmap = buildFallbackRoadmap(language, nativeLanguage, level);
  const generatedAt = new Date().toISOString();
  const units = fallbackRoadmap.units.map((fallbackUnit, unitIndex) => {
    const rawUnit = parsed.units[unitIndex];
    const fallbackLessons = fallbackRoadmap.lessons.filter(
      (lesson) => lesson.unitId === fallbackUnit.id,
    );

    const unitTitle = rawUnit?.title || fallbackUnit.title;
    const unitDescription = rawUnit?.description || fallbackUnit.description;
    const unitTheme = rawUnit?.theme || fallbackUnit.theme;
    const unitGrammarFocus = rawUnit?.grammar_focus.length
      ? rawUnit.grammar_focus
      : fallbackUnit.grammarFocus;
    const unitVocabularyFocus = rawUnit?.vocabulary_focus.length
      ? rawUnit.vocabulary_focus
      : fallbackUnit.vocabularyFocus;
    const unitCanDo = rawUnit?.can_do.length
      ? rawUnit.can_do
      : fallbackUnit.canDo;

    const lessons = fallbackLessons.map((fallbackLesson, lessonIndex) => {
      const rawLesson = rawUnit?.lessons[lessonIndex];
      const topic = rawLesson?.topic || fallbackLesson.topic;
      const lessonKind = rawLesson?.lesson_kind || fallbackLesson.lessonKind;
      const grammarFocus = rawLesson?.grammar_focus.length
        ? rawLesson.grammar_focus
        : lessonKind === 'new_vocabulary'
        ? fallbackLesson.grammarFocus
        : unitGrammarFocus;
      const vocabularyFocus = rawLesson?.vocabulary_focus.length
        ? rawLesson.vocabulary_focus
        : lessonKind === 'new_grammar'
        ? fallbackLesson.vocabularyFocus
        : unitVocabularyFocus;

      return {
        ...fallbackLesson,
        unitTitle,
        title: rawLesson?.title || fallbackLesson.title,
        description: rawLesson?.description || fallbackLesson.description,
        icon: lessonKind === 'new_vocabulary'
          ? getTopicIcon(topic)
          : lessonKind === 'new_grammar'
          ? '📘'
          : lessonKind === 'skill_practice'
          ? '🎯'
          : '🔁',
        topic,
        lessonKind,
        skillType: rawLesson?.skill_type || fallbackLesson.skillType,
        focusLabel: rawLesson?.focus_label || fallbackLesson.focusLabel,
        objective: rawLesson?.objective || fallbackLesson.objective,
        grammarFocus,
        vocabularyFocus,
        canDo: unitCanDo,
      };
    });

    return {
      unit: {
        ...fallbackUnit,
        title: unitTitle,
        description: unitDescription,
        icon: getTopicIcon(rawUnit?.theme || rawUnit?.title || fallbackUnit.title),
        theme: unitTheme || fallbackUnit.theme,
        grammarFocus: unitGrammarFocus,
        vocabularyFocus: unitVocabularyFocus,
        canDo: unitCanDo,
        lessonIds: lessons.map((lesson) => lesson.id),
      },
      lessons,
    };
  });

  return {
    id: `roadmap-${cacheKey}`,
    title: parsed.title || fallbackRoadmap.title,
    summary: parsed.summary || fallbackRoadmap.summary,
    language,
    nativeLanguage,
    level,
    learningInterests: learningInterests?.trim() || null,
    avoidedTopics: avoidedTopics?.trim() || null,
    units: units.map((entry) => entry.unit),
    lessons: units.flatMap((entry) => entry.lessons),
    generatedAt,
    expiresAt: null,
    source: 'ai',
  };
}

async function attemptProvider(
  caller: (system: string, user: string) => Promise<string>,
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  cacheKey: string,
  learningInterests?: string | null,
  avoidedTopics?: string | null,
): Promise<CourseRoadmap> {
  const { system, user } = buildRoadmapPrompt(
    language,
    nativeLanguage,
    level,
    10,
    learningInterests,
    avoidedTopics,
  );
  const raw = await caller(system, user);
  return buildRoadmapFromAI(
    raw,
    language,
    nativeLanguage,
    level,
    cacheKey,
    learningInterests,
    avoidedTopics,
  );
}

export async function ensureCourseRoadmap(
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  learningInterests?: string | null,
  avoidedTopics?: string | null,
): Promise<CourseRoadmap> {
  const cacheKey = buildRoadmapCacheKey(
    language,
    nativeLanguage,
    level,
    learningInterests,
    avoidedTopics,
  );
  const cached = await getCachedRoadmap(cacheKey);
  if (cached) return cached;

  const existing = roadmapInFlight.get(cacheKey);
  if (existing) return existing;

  const request = (async (): Promise<CourseRoadmap> => {
  if (!(await isOnline())) {
    return buildFallbackRoadmap(language, nativeLanguage, level);
  }

  try {
    const roadmap = await attemptProvider(
      callGroqRaw,
      language,
      nativeLanguage,
      level,
      cacheKey,
      learningInterests,
      avoidedTopics,
    );
    await storeRoadmap(cacheKey, roadmap);
    return roadmap;
  } catch (groqErr) {
    console.warn('[Roadmap] Groq failed:', (groqErr as Error).message);
  }

  try {
    const roadmap = await attemptProvider(
      callGeminiRaw,
      language,
      nativeLanguage,
      level,
      cacheKey,
      learningInterests,
      avoidedTopics,
    );
    await storeRoadmap(cacheKey, roadmap);
    return roadmap;
  } catch (geminiErr) {
    console.warn('[Roadmap] Gemini failed:', (geminiErr as Error).message);
  }

  return buildFallbackRoadmap(language, nativeLanguage, level);
  })();

  roadmapInFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    roadmapInFlight.delete(cacheKey);
  }
}

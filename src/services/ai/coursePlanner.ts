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
): string {
  return djb2(`roadmap:v2:${language}:${nativeLanguage}:${level}`);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
): CourseRoadmap {
  const parsed = parseRoadmapResponse(raw);
  const generatedAt = new Date().toISOString();

  const units = parsed.units.map((unit, unitIndex) => {
    const unitId = `unit-${unitIndex + 1}-${slugify(unit.title)}`;
    const lessons = unit.lessons.map((lesson, lessonIndex) => ({
      id: `${unitId}-lesson-${lessonIndex + 1}`,
      unitId,
      unitTitle: unit.title,
      unitIndex,
      lessonIndex,
      title: lesson.title,
      description: lesson.description,
      icon: lesson.lesson_kind === 'new_vocabulary'
        ? getTopicIcon(lesson.topic)
        : lesson.lesson_kind === 'new_grammar'
        ? '📘'
        : lesson.lesson_kind === 'skill_practice'
        ? '🎯'
        : '🔁',
      topic: lesson.topic,
      lessonKind: lesson.lesson_kind,
      skillType: lesson.skill_type,
      focusLabel: lesson.focus_label,
      objective: lesson.objective,
      grammarFocus: lesson.grammar_focus,
      vocabularyFocus: lesson.vocabulary_focus,
      canDo: unit.can_do,
    }));

    return {
      unit: {
        id: unitId,
        title: unit.title,
        description: unit.description,
        icon: getTopicIcon(unit.title),
        orderIndex: unitIndex,
        theme: unit.theme,
        level,
        lessonIds: lessons.map((lesson) => lesson.id),
        grammarFocus: unit.grammar_focus,
        vocabularyFocus: unit.vocabulary_focus,
        canDo: unit.can_do,
      },
      lessons,
    };
  });

  return {
    id: `roadmap-${cacheKey}`,
    title: parsed.title,
    summary: parsed.summary,
    language,
    nativeLanguage,
    level,
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
): Promise<CourseRoadmap> {
  const { system, user } = buildRoadmapPrompt(language, nativeLanguage, level);
  const raw = await caller(system, user);
  return buildRoadmapFromAI(raw, language, nativeLanguage, level, cacheKey);
}

export async function ensureCourseRoadmap(
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
): Promise<CourseRoadmap> {
  const cacheKey = buildRoadmapCacheKey(language, nativeLanguage, level);
  const cached = await getCachedRoadmap(cacheKey);
  if (cached) return cached;

  if (!(await isOnline())) {
    return buildFallbackRoadmap(language, nativeLanguage, level);
  }

  try {
    const roadmap = await attemptProvider(callGroqRaw, language, nativeLanguage, level, cacheKey);
    await storeRoadmap(cacheKey, roadmap);
    return roadmap;
  } catch (groqErr) {
    console.warn('[Roadmap] Groq failed:', (groqErr as Error).message);
  }

  try {
    const roadmap = await attemptProvider(callGeminiRaw, language, nativeLanguage, level, cacheKey);
    await storeRoadmap(cacheKey, roadmap);
    return roadmap;
  } catch (geminiErr) {
    console.warn('[Roadmap] Gemini failed:', (geminiErr as Error).message);
  }

  return buildFallbackRoadmap(language, nativeLanguage, level);
}

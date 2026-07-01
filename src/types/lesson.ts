import { CEFRLevel, SupportedLanguage } from './user';

export type SkillArea =
  | 'grammar'
  | 'vocabulary'
  | 'idioms'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'culture';

export type LessonKind =
  | 'new_vocabulary'
  | 'new_grammar'
  | 'skill_practice'
  | 'review'
  | 'listening';

export type LessonSkillType = 'vocabulary' | 'grammar' | 'mixed';

export interface Lesson {
  id: string;
  unit_id: string;
  language: SupportedLanguage;
  topic: string;
  level: CEFRLevel;
  order_index: number;
  title: string;
  description: string;
  icon_name: string;
  is_unlocked: boolean;
  is_completed: boolean;
  exercise_count: number;
  xp_reward: number;
  estimated_minutes: number;
}

export interface Unit {
  id: string;
  language: SupportedLanguage;
  skill_area: SkillArea;
  title: string;
  description: string;
  level: CEFRLevel;
  order_index: number;
  lesson_ids: string[];
  is_unlocked: boolean;
  color: string; // hex
}

export interface LessonSession {
  lesson_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  exercises_answered: number;
  exercises_correct: number;
  xp_earned: number;
  is_completed: boolean;
  time_spent_seconds: number;
}

export interface LessonDefinition {
  id: string;
  unitId: string;
  unitTitle: string;
  unitIndex: number;
  lessonIndex: number;
  title: string;
  description: string;
  icon: string;
  topic: string;
  lessonKind: LessonKind;
  skillType: LessonSkillType;
  focusLabel: string;
  objective: string;
  grammarFocus: string[];
  vocabularyFocus: string[];
  canDo: string[];
  levelOverride?: CEFRLevel;
}

export interface RoadmapUnitDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  orderIndex: number;
  theme: string;
  level: CEFRLevel;
  lessonIds: string[];
  grammarFocus: string[];
  vocabularyFocus: string[];
  canDo: string[];
}

export interface CourseRoadmap {
  id: string;
  title: string;
  summary: string;
  language: SupportedLanguage;
  nativeLanguage: SupportedLanguage;
  level: CEFRLevel;
  learningInterests: string | null;
  avoidedTopics: string | null;
  units: RoadmapUnitDefinition[];
  lessons: LessonDefinition[];
  generatedAt: string;
  expiresAt: string | null;
  source: 'ai' | 'fallback';
}

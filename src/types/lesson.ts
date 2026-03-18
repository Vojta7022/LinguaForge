import { CEFRLevel, SupportedLanguage } from './user';

export type SkillArea =
  | 'grammar'
  | 'vocabulary'
  | 'idioms'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'culture';

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

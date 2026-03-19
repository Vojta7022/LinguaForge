export type CEFRLevel = 'B1' | 'B2' | 'C1' | 'C2';

export type SupportedLanguage =
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt'
  | 'ja' | 'zh' | 'ko' | 'ru' | 'ar'
  | 'cs' | 'nl' | 'pl' | 'tr' | 'sv' | 'da' | 'no';

export interface User {
  id: string;
  display_name: string;
  email: string;
  native_language: SupportedLanguage;
  target_language: SupportedLanguage;
  current_level: CEFRLevel;
  xp: number;
  streak_count: number;
  streak_last_date: string | null; // ISO date YYYY-MM-DD
  daily_goal: number;              // target XP per day
  created_at: string;              // ISO timestamp
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  auto_play_audio: boolean;
  haptic_feedback: boolean;
  font_size: 'small' | 'medium' | 'large';
  notifications_enabled: boolean;
}

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ru: 'Russian',
  ar: 'Arabic',
  cs: 'Czech',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  ja: '🇯🇵',
  zh: '🇨🇳',
  ko: '🇰🇷',
  ru: '🇷🇺',
  ar: '🇸🇦',
  cs: '🇨🇿',
  nl: '🇳🇱',
  pl: '🇵🇱',
  tr: '🇹🇷',
  sv: '🇸🇪',
  da: '🇩🇰',
  no: '🇳🇴',
};

export const CEFR_DESCRIPTORS: Record<CEFRLevel, string> = {
  B1: 'Intermediate – common vocabulary, simple tenses',
  B2: 'Upper-Intermediate – abstract topics, conditionals, phrasal verbs',
  C1: 'Advanced – nuanced vocabulary, complex grammar, idiomatic expressions',
  C2: 'Mastery – literary language, subtle distinctions, rare constructions',
};

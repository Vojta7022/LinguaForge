import { ExerciseType } from './exercise';
import { CEFRLevel, SupportedLanguage } from './user';

export interface AIGenerationRequest {
  exercise_type: ExerciseType;
  language: SupportedLanguage;
  native_language: SupportedLanguage;
  difficulty: CEFRLevel;
  topic: string;
  count: number;              // always request 10, cache surplus
  priority: 'immediate' | 'background';
}

export interface AIGenerationResponse {
  exercises: import('./exercise').Exercise[];
  model_used: 'groq' | 'gemini';
  prompt_hash: string;
  generated_at: string;
  cached: boolean;
}

export interface SyncRecord {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  created_at: string;
  synced_at: string | null;
}

export type AIProvider = 'groq' | 'gemini';

export interface RateLimitState {
  groq_requests_this_minute: number;
  groq_requests_today: number;
  gemini_requests_this_minute: number;
  gemini_requests_today: number;
  last_groq_request_at: number; // ms timestamp
  last_gemini_request_at: number;
}

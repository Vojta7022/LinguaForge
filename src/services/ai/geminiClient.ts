import type { AIGenerationRequest, AIGenerationResponse } from '@/types/api';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_TIMEOUT_MS = 20_000;

/**
 * Fallback AI provider — Gemini free tier (direct fetch, no SDK needed)
 * Rate limits: 15 req/min, 1,500 req/day
 * Only called when Groq fails or is rate-limited
 */
export async function callGemini(
  _request: AIGenerationRequest,
): Promise<AIGenerationResponse> {
  // TODO Phase 1:
  // 1. Build prompt with promptTemplates.ts
  // 2. POST to GEMINI_BASE/models/MODEL:generateContent
  // 3. Parse + validate response with responseSchemas.ts
  // 4. Cache result in SQLite via cacheRepository
  throw new Error('Gemini client not yet implemented');
}

export { GEMINI_MODEL, GEMINI_BASE, GEMINI_TIMEOUT_MS };

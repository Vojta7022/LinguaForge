// TODO: install groq-sdk when implementing (Phase 1)
// npm install groq-sdk

import type { AIGenerationRequest, AIGenerationResponse } from '@/types/api';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_TIMEOUT_MS = 15_000;

/**
 * Primary AI provider — Groq free tier
 * Rate limits: 30 req/min, 14,400 req/day
 * Always use via exerciseGenerator.ts (never call directly from UI)
 */
export async function callGroq(
  _request: AIGenerationRequest,
): Promise<AIGenerationResponse> {
  // TODO Phase 1:
  // 1. Build prompt with promptTemplates.ts
  // 2. Call Groq chat completions API with response_format: json_object
  // 3. Parse + validate response with responseSchemas.ts
  // 4. Cache result in SQLite via cacheRepository
  throw new Error('Groq client not yet implemented');
}

export { GROQ_MODEL, GROQ_TIMEOUT_MS };

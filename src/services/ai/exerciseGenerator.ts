import type { AIGenerationRequest, AIGenerationResponse } from '@/types/api';
import type { Exercise } from '@/types/exercise';

/**
 * AI exercise generation orchestrator.
 *
 * Fallback chain:
 *   1. SQLite cache (exact prompt_hash hit, not expired)
 *   2. Groq API (primary, rate-limited queue)
 *   3. Gemini API (fallback)
 *   4. Stale SQLite cache (last resort, shows warning)
 *   5. Throw ALL_SOURCES_FAILED
 *
 * Always requests 10 exercises and caches the surplus.
 */
export async function generateExercises(
  request: AIGenerationRequest,
): Promise<Exercise[]> {
  // TODO Phase 1:
  // 1. Check cacheRepository.get(promptHash(request))
  // 2. If offline → return stale cache or throw
  // 3. requestQueue.enqueue(request, priority) → callGroq()
  // 4. On failure → callGemini()
  // 5. On failure → cacheRepository.getStale(promptHash(request))
  // 6. Validate all exercises with responseSchemas.ts before returning
  throw new Error('Exercise generator not yet implemented');
}

/** SHA-256 of the request parameters — used as cache key */
export function buildPromptHash(request: AIGenerationRequest): string {
  const key = `${request.language}:${request.native_language}:${request.difficulty}:${request.topic}:${request.exercise_type}`;
  // TODO: use crypto.subtle.digest in production
  return key;
}

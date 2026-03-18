import { useState, useCallback } from 'react';
import type { AIGenerationRequest } from '@/types/api';
import type { Exercise } from '@/types/exercise';

// TODO Phase 1: import and call generateExercises from exerciseGenerator.ts

export function useAIGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (request: AIGenerationRequest): Promise<Exercise[]> => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO Phase 1: const exercises = await generateExercises(request);
      // return exercises;
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI generation failed';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generate, isLoading, error };
}

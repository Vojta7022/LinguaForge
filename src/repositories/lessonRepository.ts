// TODO Phase 1: implement lesson and unit queries against SQLite
// Lessons are seeded from supabase/seed.sql and stored locally

import type { Lesson, Unit } from '@/types/lesson';

export async function getUnitsForLanguage(_language: string): Promise<Unit[]> {
  // TODO Phase 1
  return [];
}

export async function getLessonsForUnit(_unitId: string): Promise<Lesson[]> {
  // TODO Phase 1
  return [];
}

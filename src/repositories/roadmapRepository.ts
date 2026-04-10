import { getDB } from '@/services/database/db';
import type { CourseRoadmap } from '@/types/lesson';

export async function getCachedRoadmap(cacheKey: string): Promise<CourseRoadmap | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{
    roadmap_json: string;
    expires_at: string | null;
  }>(
    'SELECT roadmap_json, expires_at FROM course_roadmaps WHERE cache_key = ?',
    [cacheKey],
  );

  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;

  return JSON.parse(row.roadmap_json) as CourseRoadmap;
}

export async function storeRoadmap(
  cacheKey: string,
  roadmap: CourseRoadmap,
  expiresInDays = 14,
): Promise<void> {
  const db = await getDB();
  const generatedAt = roadmap.generatedAt || new Date().toISOString();
  const expiresAt = new Date(
    new Date(generatedAt).getTime() + expiresInDays * 86_400_000,
  ).toISOString();

  await db.runAsync(
    `INSERT OR REPLACE INTO course_roadmaps
     (id, cache_key, language, native_language, level, roadmap_json, generated_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      roadmap.id,
      cacheKey,
      roadmap.language,
      roadmap.nativeLanguage,
      roadmap.level,
      JSON.stringify({ ...roadmap, expiresAt }),
      generatedAt,
      expiresAt,
    ],
  );
}

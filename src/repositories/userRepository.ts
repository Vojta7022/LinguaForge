import { getDB } from '@/services/database/db';
import type { User } from '@/types/user';

export async function getUser(id: string): Promise<User | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', [id]);
  return row ?? null;
}

export async function upsertUser(user: User): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO users
     (id, display_name, email, native_language, target_language,
      current_level, xp, streak_count, streak_last_date, daily_goal,
      created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [user.id, user.display_name, user.email, user.native_language,
     user.target_language, user.current_level, user.xp, user.streak_count,
     user.streak_last_date, user.daily_goal, user.created_at, user.updated_at],
  );
}

export async function updateXP(id: string, xp: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE users SET xp = ?, updated_at = ? WHERE id = ?',
    [xp, new Date().toISOString(), id],
  );
}

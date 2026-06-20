/**
 * Sync manager — bidirectional SQLite ↔ Supabase.
 *
 * Strategy:
 *   - All writes go to SQLite first + enqueue in sync_queue
 *   - On reconnect: flush sync_queue to Supabase in chronological order
 *   - Conflict resolution:
 *     - users: MAX(xp, streak_count) to never lose progress
 *     - user_progress: INSERT ... ON CONFLICT DO NOTHING (historical records)
 *     - everything else: upsert (last-write-wins)
 *   - Exercises are NEVER synced to Supabase (local-only)
 */

import { supabase } from '@/services/auth/supabaseClient';
import { getDB } from '@/services/database/db';

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/** Row shape returned from sync_queue table. */
interface SyncQueueRow {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string; // stored as JSON string in SQLite
  created_at: string;
  synced_at: string | null;
}

function str(val: unknown): string | null {
  return typeof val === 'string' ? val : null;
}

function num(val: unknown): number | null {
  return typeof val === 'number' ? val : null;
}

/** Minimal shape of the remote users row we care about for conflict resolution. */
interface RemoteUserRow {
  id: string;
  xp: number;
  streak_count: number;
  updated_at: string;
  [key: string]: unknown;
}

/** Minimal local user snapshot used for updated_at comparison. */
interface LocalUserTimestamp {
  updated_at: string;
}

/** Minimal remote user_progress row shape for INSERT OR IGNORE. */
interface RemoteProgressRow {
  id: string;
  [key: string]: unknown;
}

/**
 * Flush all unsynced rows from sync_queue to Supabase.
 * Processes rows in chronological order; continues on per-row errors.
 */
export async function flushSyncQueue(): Promise<SyncResult> {
  const db = await getDB();

  const rows = await db.getAllAsync<SyncQueueRow>(
    'SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY created_at ASC',
  );

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const payload = JSON.parse(row.payload) as Record<string, unknown>;

      if (row.table_name === 'users') {
        // Conflict resolution: keep the MAX of xp and streak_count
        const { data: remote } = await supabase
          .from('users')
          .select('*')
          .eq('id', payload['id'])
          .single<RemoteUserRow>();

        if (remote) {
          const mergedPayload = {
            ...payload,
            xp: Math.max(
              typeof payload['xp'] === 'number' ? payload['xp'] : 0,
              remote.xp,
            ),
            streak_count: Math.max(
              typeof payload['streak_count'] === 'number' ? payload['streak_count'] : 0,
              remote.streak_count,
            ),
          };
          const { error } = await supabase
            .from('users')
            .upsert([mergedPayload], { onConflict: 'id' });
          if (error) throw new Error(error.message);
        } else {
          // No remote row yet — insert as-is
          const { error } = await supabase
            .from('users')
            .upsert([payload], { onConflict: 'id' });
          if (error) throw new Error(error.message);
        }
      } else if (row.table_name === 'user_progress') {
        // Never overwrite historical records; ignore conflicts by id
        const { error } = await supabase
          .from('user_progress')
          .insert([payload]);
        // Duplicate key errors (23505) are silently ignored per spec
        if (error && !error.message.includes('duplicate key') && error.code !== '23505') {
          throw new Error(error.message);
        }
      } else {
        // Generic upsert for all other tables
        const { error } = await supabase
          .from(row.table_name)
          .upsert([payload]);
        if (error) throw new Error(error.message);
      }

      // Mark row as synced
      await db.runAsync(
        'UPDATE sync_queue SET synced_at = ? WHERE id = ?',
        [new Date().toISOString(), row.id],
      );
      synced++;
    } catch (err) {
      failed++;
      errors.push(
        `[${row.table_name}/${row.record_id}] ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { synced, failed, errors };
}

/**
 * Pull the latest user + user_progress data from Supabase into SQLite.
 * Only overwrites local data when the remote record is newer.
 */
export async function pullFromSupabase(userId: string): Promise<void> {
  const db = await getDB();

  // 1. Fetch remote user row
  const { data: remoteUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single<RemoteUserRow>();

  if (remoteUser) {
    // Compare updated_at to decide whether to overwrite local row
    const localRow = await db.getFirstAsync<LocalUserTimestamp>(
      'SELECT updated_at FROM users WHERE id = ?',
      [userId],
    );

    const remoteTs = new Date(remoteUser.updated_at).getTime();
    const localTs = localRow ? new Date(localRow.updated_at).getTime() : 0;

    if (remoteTs > localTs) {
      await db.runAsync(
        `UPDATE users SET
          display_name    = ?,
          native_language = ?,
          target_language = ?,
          current_level   = ?,
          xp              = ?,
          streak_count    = ?,
          streak_last_date= ?,
          daily_goal      = ?,
          updated_at      = ?
        WHERE id = ?`,
        [
          str(remoteUser['display_name']),
          str(remoteUser['native_language']),
          str(remoteUser['target_language']),
          str(remoteUser['current_level']),
          typeof remoteUser.xp === 'number' ? remoteUser.xp : 0,
          typeof remoteUser.streak_count === 'number' ? remoteUser.streak_count : 0,
          str(remoteUser['streak_last_date']),
          num(remoteUser['daily_goal']),
          remoteUser.updated_at,
          userId,
        ],
      );
    }
  }

  // 2. Fetch recent progress rows from Supabase
  const { data: remoteProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false })
    .limit(50);

  if (!remoteProgress) return;

  // 3. Insert any remote rows not already in local DB (by id)
  for (const row of remoteProgress as RemoteProgressRow[]) {
    await db.runAsync(
      `INSERT OR IGNORE INTO user_progress
        (id, user_id, exercise_id, is_correct, answer_given, time_spent_ms, attempted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        str(row['id']),
        str(row['user_id']) ?? userId,
        str(row['exercise_id']),
        row['is_correct'] ? 1 : 0,
        str(row['answer_given']),
        num(row['time_spent_ms']),
        str(row['attempted_at']),
      ],
    );
  }
}

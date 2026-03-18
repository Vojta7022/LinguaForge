// TODO Phase 2: implement Supabase ↔ SQLite sync

/**
 * Sync manager — bidirectional SQLite ↔ Supabase.
 *
 * Strategy:
 *   - All writes go to SQLite first + enqueue in sync_queue
 *   - On reconnect: flush sync_queue to Supabase in chronological order
 *   - Conflict resolution:
 *     - user_progress: MAX(times_seen, times_correct, times_incorrect)
 *     - streak_records: UNION of dates (never cancel streaks)
 *     - everything else: last-write-wins on updated_at
 *   - Exercises are NEVER synced to Supabase (local-only)
 */

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export async function flushSyncQueue(): Promise<SyncResult> {
  // TODO Phase 2:
  // 1. Read all unsynced rows from sync_queue
  // 2. Group by table
  // 3. POST to Supabase with upsert
  // 4. On success: mark as synced
  // 5. On conflict: apply conflict resolution strategy
  throw new Error('Sync manager not yet implemented');
}

export async function pullFromSupabase(userId: string): Promise<void> {
  // TODO Phase 2:
  // 1. Fetch user's latest data from Supabase tables
  // 2. For each row, compare updated_at with local
  // 3. If remote is newer, update local SQLite
  throw new Error('Supabase pull not yet implemented');
}

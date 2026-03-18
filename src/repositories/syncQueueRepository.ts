import { getDB } from '@/services/database/db';
import type { SyncRecord } from '@/types/api';

export async function enqueue(record: Omit<SyncRecord, 'synced_at'>): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO sync_queue (id, table_name, record_id, operation, payload, created_at)
     VALUES (?,?,?,?,?,?)`,
    [record.id, record.table_name, record.record_id, record.operation,
     JSON.stringify(record.payload), record.created_at],
  );
}

export async function getPending(): Promise<SyncRecord[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY created_at ASC',
  );
  return rows.map((r) => ({
    ...r,
    payload: JSON.parse(r.payload as string),
  })) as SyncRecord[];
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE sync_queue SET synced_at = ? WHERE id = ?',
    [new Date().toISOString(), id],
  );
}

import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

/** Opens (or returns) the singleton SQLite database instance. */
export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('linguaforge.db');
  await runMigrations(_db);
  return _db;
}

/** Close database (call on app background if needed). */
export async function closeDB(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}

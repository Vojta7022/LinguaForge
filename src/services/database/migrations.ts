import type * as SQLite from 'expo-sqlite';

const MIGRATIONS: Array<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        email TEXT NOT NULL,
        native_language TEXT NOT NULL,
        target_language TEXT NOT NULL,
        current_level TEXT NOT NULL DEFAULT 'B2',
        xp INTEGER NOT NULL DEFAULT 0,
        streak_count INTEGER NOT NULL DEFAULT 0,
        streak_last_date TEXT,
        daily_goal INTEGER NOT NULL DEFAULT 20,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        lesson_id TEXT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        difficulty_score INTEGER NOT NULL,
        language TEXT NOT NULL,
        level TEXT NOT NULL,
        grammar_point TEXT,
        vocab_topic TEXT,
        times_shown INTEGER NOT NULL DEFAULT 0,
        times_correct INTEGER NOT NULL DEFAULT 0,
        is_cached INTEGER NOT NULL DEFAULT 1,
        ai_model_used TEXT NOT NULL,
        prompt_hash TEXT,
        generated_at TEXT NOT NULL,
        expires_at TEXT
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        is_correct INTEGER NOT NULL,
        answer_given TEXT NOT NULL,
        time_spent_ms INTEGER NOT NULL,
        attempted_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS spaced_repetition (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        next_review_date TEXT NOT NULL,
        interval_days REAL NOT NULL DEFAULT 1,
        ease_factor REAL NOT NULL DEFAULT 2.5,
        repetitions INTEGER NOT NULL DEFAULT 0,
        last_quality_rating INTEGER,
        last_reviewed_at TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, exercise_id)
      );

      CREATE TABLE IF NOT EXISTS exercise_cache_meta (
        id TEXT PRIMARY KEY,
        prompt_hash TEXT NOT NULL UNIQUE,
        language TEXT NOT NULL,
        level TEXT NOT NULL,
        topic TEXT NOT NULL,
        exercise_type TEXT NOT NULL,
        exercise_ids TEXT NOT NULL,
        cached_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_sr_user_date
        ON spaced_repetition(user_id, next_review_date);
      CREATE INDEX IF NOT EXISTS idx_progress_user
        ON user_progress(user_id, attempted_at);
      CREATE INDEX IF NOT EXISTS idx_cache_hash
        ON exercise_cache_meta(prompt_hash);
    `,
  },
];

/** Run pending migrations. Safe to call on every app start. */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO schema_version (version) VALUES (0);
  `);

  const row = await db.getFirstAsync<{ version: number }>('SELECT version FROM schema_version');
  let currentVersion = row?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await db.execAsync(migration.sql);
      await db.runAsync('UPDATE schema_version SET version = ?', [migration.version]);
      currentVersion = migration.version;
    }
  }
}

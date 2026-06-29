import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'wellium-offline.db';
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getOfflineDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }

  return dbPromise;
};

export const resetOfflineDbConnection = () => {
  dbPromise = null;
};

const runMigrations = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS offline_snapshots (
          type TEXT PRIMARY KEY NOT NULL,
          entity_id TEXT NOT NULL,
          version_id TEXT NULL,
          payload TEXT NOT NULL,
          metadata TEXT NOT NULL DEFAULT '{}',
          downloaded_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS offline_queue (
          client_operation_id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          payload TEXT NOT NULL,
          status TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          error TEXT NULL,
          base_version_id TEXT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced_at TEXT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_offline_queue_status_created
          ON offline_queue(status, created_at);
      `);
      await tx.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    });
  }
};

export const deleteOfflineDatabase = async (): Promise<void> => {
  const db = await getOfflineDb();
  await db.closeAsync();
  resetOfflineDbConnection();
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
};

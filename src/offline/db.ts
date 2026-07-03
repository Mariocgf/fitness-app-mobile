import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { isOfflineStorageSupported } from './storage-support';

const DATABASE_NAME = 'wellium-offline.db';
const SCHEMA_VERSION = 2;

/**
 * En web, sin OPFS el VFS persistente de expo-sqlite (AccessHandlePoolVFS) no
 * degrada solo a memoria: lanza. La lanzamos nosotros antes, tipada, para que
 * los consumidores puedan capturarla y degradar a network-only.
 */
export class OfflineStorageUnavailableError extends Error {
  constructor() {
    super('Almacenamiento offline no disponible en este navegador.');
    this.name = 'OfflineStorageUnavailableError';
  }
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getOfflineDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (Platform.OS === 'web' && !isOfflineStorageSupported()) {
    throw new OfflineStorageUnavailableError();
  }

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

/**
 * Ejecuta una migración dentro de una transacción atómica.
 * Nativo usa `withExclusiveTransactionAsync` (conexión separada, aislamiento
 * exclusivo) tal cual estaba. Web NO soporta esa API (lanza
 * `withExclusiveTransactionAsync is not supported on web`), así que cae a
 * `withTransactionAsync` sobre la misma conexión: como las migraciones corren
 * al abrir la DB, sin concurrencia, el resultado es equivalente y atómico.
 */
const runMigrationTransaction = async (
  db: SQLite.SQLiteDatabase,
  task: (executor: Pick<SQLite.SQLiteDatabase, 'execAsync'>) => Promise<void>,
): Promise<void> => {
  if (Platform.OS === 'web') {
    await db.withTransactionAsync(async () => {
      await task(db);
    });
    return;
  }
  await db.withExclusiveTransactionAsync(async (tx) => {
    await task(tx);
  });
};

const runMigrations = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  // AccessHandlePoolVFS (backend web de expo-sqlite) no provee shared-memory
  // para el WAL-index: se omite en web y queda el journal `delete` por defecto.
  if (Platform.OS !== 'web') {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < 1) {
    await runMigrationTransaction(db, async (tx) => {
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
      await tx.execAsync(`PRAGMA user_version = 1;`);
    });
  }

  if (currentVersion < 2) {
    // Guarda la rutina del servidor (result.result del POST /api/offline/sync)
    // cuando una operación queda en conflicto, para mostrarla en la UI de
    // resolución sin un GET extra.
    await runMigrationTransaction(db, async (tx) => {
      await tx.execAsync(
        `ALTER TABLE offline_queue ADD COLUMN conflict_server_routine TEXT NULL;`,
      );
      await tx.execAsync(`PRAGMA user_version = 2;`);
    });
  }
};

export const deleteOfflineDatabase = async (): Promise<void> => {
  const db = await getOfflineDb();
  await db.closeAsync();
  resetOfflineDbConnection();
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
};

import { Routine } from '@/src/types/routine';
import { getOfflineDb, deleteOfflineDatabase } from './db';
import {
  OfflineModuleStatus,
  OfflineOperation,
  OfflineOperationPayload,
  OfflineOperationStatus,
  OfflineOperationType,
  OfflineSnapshot,
  OfflineSnapshotType,
} from './types';

interface SnapshotRow {
  type: OfflineSnapshotType;
  entity_id: string;
  version_id: string | null;
  payload: string;
  metadata: string;
  downloaded_at: string;
  updated_at: string;
}

interface OperationRow {
  client_operation_id: string;
  type: OfflineOperationType;
  payload: string;
  status: OfflineOperationStatus;
  attempts: number;
  error: string | null;
  base_version_id: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  conflict_server_routine: string | null;
}

const nowIso = () => new Date().toISOString();

const parseJson = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapSnapshot = <T>(row: SnapshotRow): OfflineSnapshot<T> => ({
  type: row.type,
  entityId: row.entity_id,
  versionId: row.version_id,
  payload: parseJson<T>(row.payload, null as T),
  metadata: parseJson<Record<string, unknown>>(row.metadata, {}),
  downloadedAt: row.downloaded_at,
  updatedAt: row.updated_at,
});

const mapOperation = (row: OperationRow): OfflineOperation => ({
  clientOperationId: row.client_operation_id,
  type: row.type,
  payload: parseJson<OfflineOperationPayload>(row.payload, {} as OfflineOperationPayload),
  status: row.status,
  attempts: row.attempts,
  error: row.error,
  baseVersionId: row.base_version_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  syncedAt: row.synced_at,
  serverRoutine: row.conflict_server_routine
    ? parseJson<Routine | null>(row.conflict_server_routine, null)
    : null,
});

export const saveOfflineSnapshot = async <TPayload>({
  type,
  entityId,
  versionId,
  payload,
  metadata = {},
}: {
  type: OfflineSnapshotType;
  entityId: string;
  versionId?: string | null;
  payload: TPayload;
  metadata?: Record<string, unknown>;
}): Promise<OfflineSnapshot<TPayload>> => {
  const db = await getOfflineDb();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT OR REPLACE INTO offline_snapshots
      (type, entity_id, version_id, payload, metadata, downloaded_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      type,
      entityId,
      versionId ?? null,
      JSON.stringify(payload),
      JSON.stringify(metadata),
      timestamp,
      timestamp,
    ],
  );

  return {
    type,
    entityId,
    versionId: versionId ?? null,
    payload,
    metadata,
    downloadedAt: timestamp,
    updatedAt: timestamp,
  };
};

export const getOfflineSnapshot = async <TPayload>(
  type: OfflineSnapshotType,
): Promise<OfflineSnapshot<TPayload> | null> => {
  const db = await getOfflineDb();
  const row = await db.getFirstAsync<SnapshotRow>(
    'SELECT * FROM offline_snapshots WHERE type = ? LIMIT 1',
    [type],
  );
  return row ? mapSnapshot<TPayload>(row) : null;
};

export const enqueueOfflineOperation = async <TPayload extends OfflineOperationPayload>({
  clientOperationId,
  type,
  payload,
  baseVersionId,
}: {
  clientOperationId: string;
  type: OfflineOperationType;
  payload: TPayload;
  baseVersionId?: string | null;
}): Promise<OfflineOperation<TPayload>> => {
  const db = await getOfflineDb();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT OR REPLACE INTO offline_queue
      (client_operation_id, type, payload, status, attempts, error, base_version_id, created_at, updated_at, synced_at)
     VALUES (?, ?, ?, 'pending', 0, NULL, ?, ?, ?, NULL)`,
    [
      clientOperationId,
      type,
      JSON.stringify(payload),
      baseVersionId ?? null,
      timestamp,
      timestamp,
    ],
  );

  return {
    clientOperationId,
    type,
    payload,
    status: 'pending',
    attempts: 0,
    error: null,
    baseVersionId: baseVersionId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncedAt: null,
    serverRoutine: null,
  };
};

export const getSyncableOfflineOperations = async (): Promise<OfflineOperation[]> => {
  const db = await getOfflineDb();
  const rows = await db.getAllAsync<OperationRow>(
    `SELECT * FROM offline_queue
     WHERE status IN ('pending', 'failed')
     ORDER BY created_at ASC`,
  );
  return rows.map(mapOperation);
};

export const updateOfflineOperationStatus = async (
  clientOperationId: string,
  status: OfflineOperationStatus,
  options: {
    error?: string | null;
    incrementAttempts?: boolean;
    syncedAt?: string | null;
    /** Rutina del servidor a persistir (solo en conflicto). `undefined` no toca la columna. */
    serverRoutine?: Routine | null;
  } = {},
): Promise<void> => {
  const db = await getOfflineDb();
  const timestamp = nowIso();
  const syncedAt = options.syncedAt === undefined ? null : options.syncedAt;
  const serverRoutine =
    options.serverRoutine === undefined ? null : JSON.stringify(options.serverRoutine);

  await db.runAsync(
    `UPDATE offline_queue
     SET status = ?,
         attempts = attempts + ?,
         error = ?,
         updated_at = ?,
         synced_at = COALESCE(?, synced_at),
         conflict_server_routine = COALESCE(?, conflict_server_routine)
     WHERE client_operation_id = ?`,
    [
      status,
      options.incrementAttempts ? 1 : 0,
      options.error ?? null,
      timestamp,
      syncedAt,
      serverRoutine,
      clientOperationId,
    ],
  );
};

export const getConflictedOperations = async (): Promise<OfflineOperation[]> => {
  const db = await getOfflineDb();
  const rows = await db.getAllAsync<OperationRow>(
    `SELECT * FROM offline_queue
     WHERE status = 'conflict'
     ORDER BY created_at ASC`,
  );
  return rows.map(mapOperation);
};

export const getOfflineOperationCounts = async (): Promise<{
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
}> => {
  const db = await getOfflineDb();
  const rows = await db.getAllAsync<{ status: OfflineOperationStatus; count: number }>(
    `SELECT status, COUNT(*) as count
     FROM offline_queue
     WHERE status IN ('pending', 'syncing', 'failed', 'conflict')
     GROUP BY status`,
  );

  return rows.reduce(
    (acc, row) => {
      if (row.status === 'conflict') acc.conflictCount += row.count;
      else if (row.status === 'failed') acc.failedCount += row.count;
      else acc.pendingCount += row.count;
      return acc;
    },
    { pendingCount: 0, failedCount: 0, conflictCount: 0 },
  );
};

export const getOfflineModuleStatus = async (
  type: OfflineSnapshotType,
): Promise<OfflineModuleStatus> => {
  const [snapshot, counts] = await Promise.all([
    getOfflineSnapshot(type),
    getOfflineOperationCounts(),
  ]);

  return {
    isAvailable: snapshot != null,
    downloadedAt: snapshot?.downloadedAt ?? null,
    pendingCount: counts.pendingCount,
    failedCount: counts.failedCount,
    conflictCount: counts.conflictCount,
  };
};

export const clearOfflineData = async (): Promise<void> => {
  const db = await getOfflineDb();
  await db.execAsync(`
    DELETE FROM offline_queue;
    DELETE FROM offline_snapshots;
  `);
};

export const destroyOfflineData = async (): Promise<void> => {
  try {
    await deleteOfflineDatabase();
  } catch {
    await clearOfflineData();
  }
};

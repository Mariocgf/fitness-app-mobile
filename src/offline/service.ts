import * as Crypto from 'expo-crypto';

import apiClient from '@/src/api/client';
import {
  getRoutineMealDetail,
  getActiveNutritionRoutine,
  getOfflineNutritionRoutineBundle,
} from '@/src/services/nutritionRoutine.service';
import {
  getActiveRoutine,
  CreateRoutinePayload,
} from '@/src/services/routine.service';
import { NutritionRoutineDto, RoutineMealDetailDto } from '@/src/types/nutritionRoutine';
import { Routine } from '@/src/types/routine';
import { SessionLog } from '@/src/types/session';
import {
  enqueueOfflineOperation,
  getOfflineSnapshot,
  getSyncableOfflineOperations,
  saveOfflineSnapshot,
  updateOfflineOperationStatus,
} from './repository';
import {
  OfflineNutritionPayload,
  NutritionPlanMealLogOperationPayload,
  RoutineUpdateOperationPayload,
  TrainingSessionOperationPayload,
} from './types';

export const createClientOperationId = (): string => Crypto.randomUUID();

interface OfflineSyncApiOperation {
  clientOperationId: string;
  type: string;
  baseVersionId: string | null;
  payload: unknown;
}

interface OfflineSyncApiResult {
  clientOperationId: string;
  status: 'synced' | 'failed' | 'conflict' | 'skipped' | 'processing';
  error?: string | null;
  result?: unknown;
}

interface OfflineSyncApiResponse {
  results: OfflineSyncApiResult[];
}

const unwrapApiData = <T>(value: T | { data: T }): T => {
  if (
    value &&
    typeof value === 'object' &&
    'data' in value &&
    Object.keys(value as object).length === 1
  ) {
    return (value as { data: T }).data;
  }
  return value as T;
};

export const downloadFitnessRoutineOffline = async (
  token: string | null,
  routine?: Routine | null,
) => {
  const activeRoutine = routine ?? await getActiveRoutine(token);
  if (!activeRoutine) throw new Error('No hay rutina activa para descargar.');

  return saveOfflineSnapshot<Routine>({
    type: 'fitness-active-routine',
    entityId: activeRoutine.id,
    versionId: activeRoutine.activeVersionId ?? null,
    payload: activeRoutine,
    metadata: {
      name: activeRoutine.name,
      versionNumber: activeRoutine.versionNumber ?? null,
    },
  });
};

export const getOfflineFitnessRoutine = async (): Promise<Routine | null> => {
  const snapshot = await getOfflineSnapshot<Routine>('fitness-active-routine');
  return snapshot?.payload ?? null;
};

export const downloadNutritionRoutineOffline = async (token: string | null) => {
  const bundle = await getOfflineNutritionRoutineBundle(token);

  if (bundle) {
    return saveOfflineSnapshot<OfflineNutritionPayload>({
      type: 'nutrition-active-routine',
      entityId: bundle.routine.id,
      versionId: null,
      payload: bundle,
      metadata: { name: bundle.routine.name },
    });
  }

  const routine = await getActiveNutritionRoutine(token);
  if (!routine) throw new Error('No hay plan nutricional activo para descargar.');

  const mealIds = Array.from(
    new Set(routine.days.flatMap((day) => day.meals.map((meal) => meal.id))),
  );

  const detailEntries = await Promise.all(
    mealIds.map(async (mealId) => {
      const detail = await getRoutineMealDetail(mealId, token);
      return [mealId, detail] as const;
    }),
  );

  const payload: OfflineNutritionPayload = {
    routine,
    mealDetails: Object.fromEntries(detailEntries),
  };

  return saveOfflineSnapshot<OfflineNutritionPayload>({
    type: 'nutrition-active-routine',
    entityId: routine.id,
    versionId: null,
    payload,
    metadata: { name: routine.name },
  });
};

export const getOfflineNutritionRoutine = async (): Promise<NutritionRoutineDto | null> => {
  const snapshot = await getOfflineSnapshot<OfflineNutritionPayload>('nutrition-active-routine');
  return snapshot?.payload.routine ?? null;
};

export const getOfflineRoutineMealDetail = async (
  mealId: string,
): Promise<RoutineMealDetailDto | null> => {
  const snapshot = await getOfflineSnapshot<OfflineNutritionPayload>('nutrition-active-routine');
  return snapshot?.payload.mealDetails[mealId] ?? null;
};

export const enqueueTrainingSessionOffline = async (log: SessionLog) =>
  enqueueOfflineOperation<TrainingSessionOperationPayload>({
    clientOperationId: createClientOperationId(),
    type: 'training-session.create',
    payload: { log },
    baseVersionId: null,
  });

export const enqueueNutritionPlanMealLogOffline = async (
  payload: NutritionPlanMealLogOperationPayload,
) =>
  enqueueOfflineOperation<NutritionPlanMealLogOperationPayload>({
    clientOperationId: createClientOperationId(),
    type: 'nutrition-plan-meal.log',
    payload,
    baseVersionId: null,
  });

export const enqueueRoutineUpdateOffline = async ({
  routineId,
  updatePayload,
  offlineRoutine,
  baseVersionId,
}: {
  routineId: string;
  updatePayload: CreateRoutinePayload;
  offlineRoutine: Routine;
  baseVersionId?: string | null;
}) =>
  enqueueOfflineOperation<RoutineUpdateOperationPayload>({
    clientOperationId: createClientOperationId(),
    type: 'routine.update',
    payload: { routineId, updatePayload, offlineRoutine },
    baseVersionId: baseVersionId ?? offlineRoutine.activeVersionId ?? null,
  });

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return 'No se pudo sincronizar. Intentá de nuevo.';
};

const toSyncApiOperation = (op: Awaited<ReturnType<typeof getSyncableOfflineOperations>>[number]): OfflineSyncApiOperation => {
  if (op.type === 'training-session.create') {
    return {
      clientOperationId: op.clientOperationId,
      type: op.type,
      baseVersionId: op.baseVersionId,
      payload: (op.payload as TrainingSessionOperationPayload).log,
    };
  }

  if (op.type === 'nutrition-plan-meal.log') {
    const payload = op.payload as NutritionPlanMealLogOperationPayload;
    return {
      clientOperationId: op.clientOperationId,
      type: op.type,
      baseVersionId: op.baseVersionId,
      payload: {
        mealId: payload.mealId,
        date: payload.date,
      },
    };
  }

  const payload = op.payload as RoutineUpdateOperationPayload;
  return {
    clientOperationId: op.clientOperationId,
    type: op.type,
    baseVersionId: op.baseVersionId,
    payload: {
      routineId: payload.routineId,
      updatePayload: payload.updatePayload,
    },
  };
};

const postOfflineSync = async (
  token: string | null,
  operations: OfflineSyncApiOperation[],
): Promise<OfflineSyncApiResponse> => {
  const { data } = await apiClient.post<OfflineSyncApiResponse | { data: OfflineSyncApiResponse }>(
    '/api/offline/sync',
    { operations },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return unwrapApiData(data);
};

export const syncOfflineOperations = async (token: string | null): Promise<{
  synced: number;
  failed: number;
  conflicts: number;
}> => {
  const operations = await getSyncableOfflineOperations();
  if (operations.length === 0) return { synced: 0, failed: 0, conflicts: 0 };

  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  for (const op of operations) {
    await updateOfflineOperationStatus(op.clientOperationId, 'syncing');
  }

  try {
    const response = await postOfflineSync(token, operations.map(toSyncApiOperation));
    const resultsById = new Map(response.results.map((result) => [result.clientOperationId, result]));

    for (const op of operations) {
      const result = resultsById.get(op.clientOperationId);

      if (!result) {
        await updateOfflineOperationStatus(op.clientOperationId, 'failed', {
          error: 'El servidor no devolvió resultado para esta operación.',
          incrementAttempts: true,
        });
        failed += 1;
        continue;
      }

      if (result.status === 'synced' || result.status === 'skipped') {
        const payload = op.payload as RoutineUpdateOperationPayload;
        if (op.type === 'routine.update') {
          await downloadFitnessRoutineOffline(null, (result.result as Routine | null) ?? payload.offlineRoutine);
        }

        await updateOfflineOperationStatus(op.clientOperationId, 'synced', {
          syncedAt: new Date().toISOString(),
        });
        synced += 1;
        continue;
      }

      if (result.status === 'conflict') {
        await updateOfflineOperationStatus(op.clientOperationId, 'conflict', {
          error: result.error ?? 'La operación tiene un conflicto de sincronización.',
          incrementAttempts: true,
        });
        conflicts += 1;
        continue;
      }

      await updateOfflineOperationStatus(op.clientOperationId, 'failed', {
        error: result.error ?? 'La operación no se pudo sincronizar.',
        incrementAttempts: true,
      });
      failed += 1;
    }
  } catch (error) {
    const message = getErrorMessage(error);
    for (const op of operations) {
      await updateOfflineOperationStatus(op.clientOperationId, 'failed', {
        error: message,
        incrementAttempts: true,
      });
    }
    failed = operations.length;
    synced = 0;
    conflicts = 0;
  }

  return { synced, failed, conflicts };
};

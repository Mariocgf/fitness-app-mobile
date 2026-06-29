import { CreateRoutinePayload } from '@/src/services/routine.service';
import { NutritionRoutineDto, RoutineMealDetailDto } from '@/src/types/nutritionRoutine';
import { Routine } from '@/src/types/routine';
import { SessionLog } from '@/src/types/session';

export type OfflineSnapshotType = 'fitness-active-routine' | 'nutrition-active-routine';

export type OfflineOperationType =
  | 'training-session.create'
  | 'nutrition-plan-meal.log'
  | 'routine.update';

export type OfflineOperationStatus =
  | 'pending'
  | 'syncing'
  | 'failed'
  | 'conflict'
  | 'synced';

export interface OfflineSnapshot<TPayload = unknown> {
  type: OfflineSnapshotType;
  entityId: string;
  versionId: string | null;
  payload: TPayload;
  metadata: Record<string, unknown>;
  downloadedAt: string;
  updatedAt: string;
}

export interface OfflineNutritionPayload {
  routine: NutritionRoutineDto;
  mealDetails: Record<string, RoutineMealDetailDto>;
}

export interface TrainingSessionOperationPayload {
  log: SessionLog;
}

export interface NutritionPlanMealLogOperationPayload {
  mealId: string;
  date: string;
  routineId: string | null;
  mealName: string | null;
  mealType: string | null;
}

export interface RoutineUpdateOperationPayload {
  routineId: string;
  updatePayload: CreateRoutinePayload;
  offlineRoutine: Routine;
}

export type OfflineOperationPayload =
  | TrainingSessionOperationPayload
  | NutritionPlanMealLogOperationPayload
  | RoutineUpdateOperationPayload;

export interface OfflineOperation<TPayload = OfflineOperationPayload> {
  clientOperationId: string;
  type: OfflineOperationType;
  payload: TPayload;
  status: OfflineOperationStatus;
  attempts: number;
  error: string | null;
  baseVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
}

export interface OfflineModuleStatus {
  isAvailable: boolean;
  downloadedAt: string | null;
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
}

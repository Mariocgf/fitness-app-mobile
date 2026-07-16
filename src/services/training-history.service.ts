import { logger } from '@/src/utils/logger';
import { AxiosError } from 'axios';
import apiClient from '../api/client';
import {
    CreateManualSessionPayload,
    PagedTrainingHistoryResponse,
    PagedTrainingHistoryResponseDto,
    TrainingHistoryExerciseDto,
    TrainingHistoryFilters,
    TrainingHistorySession,
    TrainingHistorySessionDto,
    TrainingHistorySetDto,
} from '../types/training-history';
import { withRequestSignal } from '../utils/request-cancellation';
import { averageRpe } from '../utils/rpe';

/** Convierte segundos totales a "hh:mm:ss" (con ceros a la izquierda) */
const secondsToHms = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/** Convierte "HH:mm:ss" o "H:mm:ss" a segundos totales */
const parseHmsToSeconds = (hms: string): number => {
  if (!hms) return 0;
  const parts = hms.split(':');
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts.map((p) => parseInt(p, 10) || 0);
  return h * 3600 + m * 60 + s;
};

/**
 * Parsea un RPE que puede venir como string, number, `null` o ausente.
 *
 * `null` = el usuario no lo registró. El `0` también cae en `null` a propósito: era el
 * centinela viejo de "no registrado" y ya no es un valor válido, así que un backend que
 * todavía lo mande no debe contaminar promedios ni pintarse como un esfuerzo real.
 */
const toNullableRpe = (value: string | number | null | undefined): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/** Mapea un SetDto a modelo de dominio (el RPE ahora vive acá, y puede ser `null`) */
const mapSetDto = (dto: TrainingHistorySetDto): TrainingHistorySession['exercises'][number]['sets'][number] => ({
  setNumber: parseInt(dto.setNumber, 10) || 0,
  repsPerformed: parseInt(dto.repsPerformed, 10) || 0,
  weightUsed: parseFloat(dto.weightUsed) || 0,
  durationSeconds: parseInt(dto.durationSeconds, 10) || 0,
  rpe: toNullableRpe(dto.rpe),
  isCompleted: dto.isCompleted,
});

/** Mapea un ExerciseDto a modelo de dominio. El `rpe` del ejercicio ya no lo manda
 * el back: se deriva como promedio de los sets con esfuerzo cargado, ignorando los
 * `null` (fallback al `rpe` legacy si aún viniera a este nivel). */
const mapExerciseDto = (dto: TrainingHistoryExerciseDto) => {
  const sets = (dto.sets ?? []).map(mapSetDto);

  return {
    exerciseId: dto.exerciseId,
    exerciseName: dto.exerciseName,
    exerciseNameEs: dto.exerciseNameEs,
    gifUrl: dto.gifUrl,
    targetMuscles: dto.targetMuscles ?? [],
    rpe: averageRpe(sets.map((set) => set.rpe)) ?? toNullableRpe(dto.rpe),
    sets,
  };
};

/** Mapea un SessionDto a modelo de dominio */
const mapSessionDto = (dto: TrainingHistorySessionDto): TrainingHistorySession => ({
  id: dto.id,
  trainedAt: new Date(dto.trainedAt),
  totalSeconds: parseHmsToSeconds(dto.totalTime),
  routineId: dto.routineId,
  routineName: dto.routineName,
  routineVersionId: dto.routineVersionId ?? null,
  // El número puede venir como number o string; las versiones arrancan en 1, así
  // que `Number(...) || null` descarta 0/NaN/"" sin perder ningún valor válido.
  routineVersionNumber:
    dto.routineVersionNumber == null ? null : Number(dto.routineVersionNumber) || null,
  exercises: (dto.exercises ?? []).map(mapExerciseDto),
});

/**
 * Obtiene el historial de entrenamiento paginado con filtros opcionales.
 * GET /api/Routine/training-history
 */
export const fetchTrainingHistory = async (
  filters: TrainingHistoryFilters,
  page: number = 1,
  pageSize: number = 10,
  token: string | null,
  signal?: AbortSignal,
): Promise<PagedTrainingHistoryResponse> => {
  const url = '/api/Routine/training-history';

  // Construir params solo con valores no nulos
  const params: Record<string, string | number> = { Page: page, PageSize: pageSize };
  if (filters.fromDate) params.FromDate = filters.fromDate.toISOString();
  if (filters.toDate) params.ToDate = filters.toDate.toISOString();
  if (filters.routineId) params.RoutineId = filters.routineId;
  if (filters.targetMuscle) params.TargetMuscle = filters.targetMuscle;

  try {
    const { data } = await apiClient.get<PagedTrainingHistoryResponseDto>(url, withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
      params,
    }, signal));

    return {
      page: parseInt(data.page, 10) || page,
      pageSize: parseInt(data.pageSize, 10) || pageSize,
      totalCount: parseInt(data.totalCount, 10) || 0,
      items: (data.items ?? []).map(mapSessionDto),
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[training-history.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Busca una sesión por id.
 * Fetcha la primera página con pageSize=50 y filtra localmente.
 * Retorna null si no existe.
 */
export const getTrainingSessionById = async (
  id: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<TrainingHistorySession | null> => {
  try {
    const response = await fetchTrainingHistory(
      { fromDate: null, toDate: null, routineId: null, targetMuscle: null },
      1,
      50,
      token,
      signal,
    );
    return response.items.find((s) => s.id === id) ?? null;
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[training-history.service] getTrainingSessionById FAIL', {
        id,
        status: error.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Registra una sesión histórica manual (sin rutina asociada).
 * POST /api/routine/sessions/manual
 * Filosofía del contrato: sin campos obligatorios salvo el ejercicio; los opcionales
 * vacíos se omiten para que el back aplique sus defaults (trainedAt = ahora, etc.).
 * Devuelve el Guid de la sesión creada.
 */
export const createManualTrainingSession = async (
  payload: CreateManualSessionPayload,
  token: string | null,
): Promise<string> => {
  if (!token) throw new Error('No autenticado');

  const url = '/api/routine/sessions/manual';

  // Solo mando lo que el usuario cargó; el resto lo resuelve el back con sus defaults.
  const body: Record<string, unknown> = {
    exercises: payload.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      ...(exercise.exerciseNameSnapshot
        ? { exerciseNameSnapshot: exercise.exerciseNameSnapshot }
        : {}),
      sets: exercise.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight,
        // El RPE se omite si el usuario no lo eligió: `null`/ausente = "no registrado".
        // Mandar un default inventado sería peor que el viejo `0` (indistinguible de
        // un esfuerzo real), y el `0` en sí ahora es un 400.
        ...(set.rpe != null ? { rpe: set.rpe } : {}),
        ...(set.durationSeconds != null ? { durationSeconds: set.durationSeconds } : {}),
      })),
    })),
  };

  if (payload.trainedAt) body.trainedAt = payload.trainedAt.toISOString();
  if (payload.totalSeconds && payload.totalSeconds > 0) {
    body.totalTime = secondsToHms(payload.totalSeconds);
  }

  try {
    const { data } = await apiClient.post<string>(url, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // El endpoint devuelve el Guid plano; contemplamos { data } por si el back lo envuelve.
    return typeof data === 'string' ? data : ((data as any)?.data ?? '');
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[training-history.service] createManualTrainingSession FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Elimina una sesión de entrenamiento por id.
 * DELETE /api/routine/sessions/{id}
 * Retorna true si se eliminó exitosamente (204), false si no se encontró (404).
 * Lanza error para otros códigos (403, 401, etc.)
 */
export const deleteTrainingSession = async (
  id: string,
  token: string | null,
): Promise<boolean> => {
  if (!token) throw new Error('No autenticado');

  const url = `/api/routine/sessions/${id}`;

  try {
    const response = await apiClient.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 204 No Content = éxito
    if (response.status === 204) {
      return true;
    }
    return false;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      logger.error('[training-history.service] deleteTrainingSession FAIL', {
        id,
        status,
        message,
      });

      if (status === 404) {
        return false; // Sesión no encontrada
      }
      if (status === 403) {
        throw new Error('No tienes permiso para eliminar esta sesión');
      }
      if (status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente');
      }
    }
    throw error;
  }
};

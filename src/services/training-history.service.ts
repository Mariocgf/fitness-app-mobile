import { logger } from '@/src/utils/logger';
import { AxiosError } from 'axios';
import apiClient from '../api/client';
import {
    PagedTrainingHistoryResponse,
    PagedTrainingHistoryResponseDto,
    TrainingHistoryExerciseDto,
    TrainingHistoryFilters,
    TrainingHistorySession,
    TrainingHistorySessionDto,
    TrainingHistorySetDto,
} from '../types/training-history';

/** Convierte "HH:mm:ss" o "H:mm:ss" a segundos totales */
const parseHmsToSeconds = (hms: string): number => {
  if (!hms) return 0;
  const parts = hms.split(':');
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts.map((p) => parseInt(p, 10) || 0);
  return h * 3600 + m * 60 + s;
};

/** Mapea un SetDto a modelo de dominio */
const mapSetDto = (dto: TrainingHistorySetDto) => ({
  setNumber: parseInt(dto.setNumber, 10) || 0,
  repsPerformed: parseInt(dto.repsPerformed, 10) || 0,
  weightUsed: parseFloat(dto.weightUsed) || 0,
  durationSeconds: parseInt(dto.durationSeconds, 10) || 0,
  isCompleted: dto.isCompleted,
});

/** Mapea un ExerciseDto a modelo de dominio */
const mapExerciseDto = (dto: TrainingHistoryExerciseDto) => ({
  exerciseId: dto.exerciseId,
  exerciseName: dto.exerciseName,
  exerciseNameEs: dto.exerciseNameEs,
  gifUrl: dto.gifUrl,
  targetMuscles: dto.targetMuscles ?? [],
  rpe: parseFloat(dto.rpe) || 0,
  sets: (dto.sets ?? []).map(mapSetDto),
});

/** Mapea un SessionDto a modelo de dominio */
const mapSessionDto = (dto: TrainingHistorySessionDto): TrainingHistorySession => ({
  id: dto.id,
  trainedAt: new Date(dto.trainedAt),
  totalSeconds: parseHmsToSeconds(dto.totalTime),
  routineId: dto.routineId,
  routineName: dto.routineName,
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
): Promise<PagedTrainingHistoryResponse> => {
  const url = '/api/Routine/training-history';

  // Construir params solo con valores no nulos
  const params: Record<string, string | number> = { Page: page, PageSize: pageSize };
  if (filters.fromDate) params.FromDate = filters.fromDate.toISOString();
  if (filters.toDate) params.ToDate = filters.toDate.toISOString();
  if (filters.routineId) params.RoutineId = filters.routineId;
  if (filters.targetMuscle) params.TargetMuscle = filters.targetMuscle;

  try {
    const { data } = await apiClient.get<PagedTrainingHistoryResponseDto>(url, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

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
): Promise<TrainingHistorySession | null> => {
  try {
    const response = await fetchTrainingHistory(
      { fromDate: null, toDate: null, routineId: null, targetMuscle: null },
      1,
      50,
      token,
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

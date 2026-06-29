import apiClient from '../api/client';
import { ExerciseInfo, ExerciseInstructions } from '../types/exercise';
import { ExerciseLoadType, capitalize } from '../utils/format.utils';
import { withRequestSignal } from '../utils/request-cancellation';

/**
 * Obtiene la información detallada de un ejercicio.
 * @param exerciseId ID del ejercicio
 * @param token Token de autenticación de Clerk
 */
export const getExerciseInfo = async (
  exerciseId: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<ExerciseInfo> => {
  const { data } = await apiClient.get<ExerciseInfo>(
    `/api/Exercise/${exerciseId}/info`,
    withRequestSignal({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, signal),
  );
  return data;
};

/**
 * Obtiene las instrucciones de un ejercicio.
 * @param exerciseId ID del ejercicio
 * @param token Token de autenticación de Clerk
 */
export const getExerciseInstructions = async (
  exerciseId: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<ExerciseInstructions> => {
  const { data } = await apiClient.get<ExerciseInstructions>(
    `/api/Exercise/${exerciseId}/instructions`,
    withRequestSignal({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, signal),
  );
  return data;
};

export interface AdjustLoadResponse {
  loadType: ExerciseLoadType | null;
  plannedWeightKg: number | null;
  currentRep: number | null;
  durationSeconds: number | null;
}

/**
 * Ajusta la carga de un ejercicio en base al RPE reportado.
 * @param exerciseId ID del ejercicio
 * @param rpe Valor de RPE reportado (0-10)
 * @param token Token de autenticación de Clerk
 */
export const adjustExerciseLoad = async (
  exerciseId: string,
  routineDayId: string,
  rpe: number,
  token: string | null
): Promise<AdjustLoadResponse> => {
  const { data } = await apiClient.post<AdjustLoadResponse>(
    '/api/Exercise/adjust-load',
    { exerciseId, routineDayId, rpe },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
};

// ── Funciones para búsqueda de ejercicios en la creación de rutinas ──

/**
 * Obtiene la lista de músculos objetivo disponibles.
 * @param token Token de autenticación de Clerk.
 */
export const getTargetMuscles = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<{ name: string }[]> => {
  const { data } = await apiClient.get<{ name: string }[]>(
    '/api/Exercise/target-muscles',
    withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal),
  );
  return data;
};

/**
 * Obtiene la lista de equipamientos disponibles.
 * @param token Token de autenticación de Clerk.
 */
export const getExerciseEquipments = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<{ name: string }[]> => {
  const { data } = await apiClient.get<{ name: string }[]>(
    '/api/Exercise/equipments',
    withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal),
  );
  return data;
};

/** Item de ejercicio en la búsqueda */
export interface ExerciseSearchItem {
  exerciseId: string;
  name: string;
  gifUrl: string;
  equipments: string[];
}

/** Respuesta paginada de búsqueda de ejercicios */
export interface ExerciseSearchResponse {
  items: ExerciseSearchItem[];
  totalCount: string;
  hasNextPage: boolean;
}

/**
 * Busca ejercicios con filtros opcionales.
 * @param params Parámetros de búsqueda y paginación.
 * @param token Token de autenticación de Clerk.
 */
export const searchExercises = async (
  params: {
    searchTerm?: string;
    targetMuscles?: string[];
    equipments?: string[];
    page?: number;
    pageSize?: number;
  },
  token: string | null,
  signal?: AbortSignal,
): Promise<ExerciseSearchResponse> => {
  const searchParams = new URLSearchParams();
  if (params.searchTerm) searchParams.set('SearchTerm', params.searchTerm);
  if (params.targetMuscles?.length) {
    params.targetMuscles.forEach((m) => searchParams.append('TargetMuscles', m));
  }
  if (params.equipments?.length) {
    params.equipments.forEach((e) => searchParams.append('Equipments', e));
  }
  searchParams.set('Page', String(params.page ?? 1));
  searchParams.set('PageSize', String(params.pageSize ?? 10));

  const { data } = await apiClient.get<ExerciseSearchResponse>(
    `/api/Exercise/search?${searchParams.toString()}`,
    withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal),
  );
  return {
    ...data,
    items: data.items.map((item) => ({ ...item, name: capitalize(item.name) })),
  };
};

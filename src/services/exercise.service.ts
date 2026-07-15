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

/** Una serie ejecutada que se manda como evidencia del ajuste. */
export interface AdjustLoadSet {
  repsPerformed: number;
  /** Obligatorio: una serie sin esfuerzo no es evidencia de nada, no se manda. */
  rpe: number;
  /** Solo para ejercicios por tiempo; `null` si no aplica. */
  durationSeconds: number | null;
}

export interface AdjustLoadResponse {
  /** Explicación del backend sobre qué decidió y por qué. Se le muestra al usuario. */
  decision: string | null;
  loadType: ExerciseLoadType | null;
  plannedWeightKg: number | null;
  currentRep: number | null;
  durationSeconds: number | null;
}

/** DTO crudo: el backend serializa los números como strings (igual que el resto de la API). */
interface AdjustLoadResponseDto {
  decision?: string | null;
  loadType?: ExerciseLoadType | null;
  plannedWeightKg?: string | number | null;
  currentRep?: string | number | null;
  durationSeconds?: string | number | null;
}

/**
 * Parsea un número que puede venir como string, `null`, ausente o `""`.
 * No se usa `Number(x) || null` a propósito: un `0` legítimo (peso corporal) se perdería.
 */
const toNullableNumber = (value: string | number | null | undefined): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Ajusta la carga de un ejercicio en base a las series ya ejecutadas.
 *
 * El backend recibe las SERIES (reps + esfuerzo + duración) y hace él la agregación:
 * el front no le manda un promedio pre-calculado.
 *
 * Solo se mandan las series ejecutadas con la CARGA VIGENTE (o sea, posteriores al
 * último ajuste) y que tengan esfuerzo registrado — una serie sin RPE no es evidencia
 * de nada. Si no queda ninguna, NO se llama a este endpoint: no hay ajuste sin dato, y
 * no se inventa un esfuerzo para poder llamarlo.
 *
 * @param exerciseId ID del ejercicio
 * @param routineDayId ID del día de rutina
 * @param sets Series con esfuerzo registrado desde el último ajuste (al menos una)
 * @param token Token de autenticación de Clerk
 */
export const adjustExerciseLoad = async (
  exerciseId: string,
  routineDayId: string,
  sets: AdjustLoadSet[],
  token: string | null
): Promise<AdjustLoadResponse> => {
  const { data } = await apiClient.post<AdjustLoadResponseDto>(
    '/api/Exercise/adjust-load',
    {
      exerciseId,
      routineDayId,
      sets: sets.map((set) => ({
        repsPerformed: set.repsPerformed,
        rpe: set.rpe,
        ...(set.durationSeconds != null ? { durationSeconds: set.durationSeconds } : {}),
      })),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return {
    decision: data?.decision?.trim() ? data.decision.trim() : null,
    loadType: data?.loadType ?? null,
    plannedWeightKg: toNullableNumber(data?.plannedWeightKg),
    currentRep: toNullableNumber(data?.currentRep),
    durationSeconds: toNullableNumber(data?.durationSeconds),
  };
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

import { logger } from '@/src/utils/logger';
import { AxiosError } from 'axios';
import apiClient from '../api/client';
import {
  AdaptRoutineResponseDto,
  PagedRoutinesResponse,
  Routine,
  RoutineDay,
  RoutinePreviewResponse,
  RoutineVersionDetail,
  RoutineVersionsResponse,
  SwapPick,
  SwapSuggestionsResponse,
} from '../types/routine';
import { SessionLog } from '../types/session';
import { ExerciseLoadType, capitalize } from '../utils/format.utils';
import { withRequestSignal } from '../utils/request-cancellation';

export interface OfflineRequestOptions {
  clientOperationId?: string | null;
  baseVersionId?: string | null;
}

const buildOfflineHeaders = (options?: OfflineRequestOptions): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (options?.clientOperationId) {
    headers['Idempotency-Key'] = options.clientOperationId;
    headers['X-Client-Operation-Id'] = options.clientOperationId;
  }

  if (options?.baseVersionId) {
    headers['X-Base-Version-Id'] = options.baseVersionId;
  }

  return headers;
};

/** Payload de un ejercicio para crear rutina manualmente */
export interface CreateRoutineExercisePayload {
  exerciseId: string;
  order: number;
  sets: number;
  repMode: 'reps' | 'secs';
  reps: number | null;
  durationSeconds: number | null;
  restSeconds: number;
  loadType: ExerciseLoadType;
  plannedWeightKg: number | null;
}

/** Payload de un día para crear rutina manualmente */
export interface CreateRoutineDayPayload {
  dayOfWeek: string;
  approxTimeSession: number;
  exercises: CreateRoutineExercisePayload[];
}

/** Payload completo para crear rutina manualmente */
export interface CreateRoutinePayload {
  name: string;
  activate: boolean;
  days: CreateRoutineDayPayload[];
}

/** Capitaliza el nombre de cada ejercicio dentro de los días (mismo shape en rutina y versión). */
const capitalizeDays = (days: RoutineDay[] | undefined): RoutineDay[] =>
  days?.map((day) => ({
    ...day,
    exercises: day.exercises?.map((ex) => ({ ...ex, name: capitalize(ex.name) })) ?? [],
  })) ?? [];

const capitalizeRoutineNames = (routine: Routine): Routine => ({
  ...routine,
  days: capitalizeDays(routine.days),
});

const capitalizeVersionDetail = (detail: RoutineVersionDetail): RoutineVersionDetail => ({
  ...detail,
  days: capitalizeDays(detail.days),
});

/**
 * Genera una rutina personalizada usando la IA del backend.
 * Llama al endpoint POST /api/Routine/generate-routine.
 * @param token Token de autenticación de Clerk.
 */
export const generateRoutine = async (
  token: string | null
): Promise<Routine> => {
  const { data } = await apiClient.post<Routine>(
    '/api/Routine/generate-routine',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return capitalizeRoutineNames(data);
};

/**
 * Regenera la rutina actual del usuario usando la IA del backend.
 * Llama al endpoint POST /api/Routine/regenerate-routine.
 * @param token Token de autenticación de Clerk.
 */
export const regenerateRoutine = async (
  token: string | null
): Promise<Routine> => {
  const { data } = await apiClient.post<Routine>(
    '/api/Routine/regenerate-routine',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return capitalizeRoutineNames(data);
};

/**
 * Obtiene la rutina activa del usuario.
 * @param token Token de autenticación de Clerk.
 */
export const getActiveRoutine = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<Routine | null> => {
  try {
    const { data } = await apiClient.get<Routine>(
      '/api/Routine/active-routine',
      withRequestSignal({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }, signal),
    );
    return capitalizeRoutineNames(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Guarda una sesión de entrenamiento completada.
 * Llama al endpoint POST /api/Routine/sessions.
 * @param log Objeto con los datos de la sesión.
 * @param token Token de autenticación de Clerk.
 */
export const saveSession = async (
  log: SessionLog,
  token: string | null,
  options?: OfflineRequestOptions,
): Promise<void> => {
  await apiClient.post(
    '/api/Routine/sessions',
    log,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        ...buildOfflineHeaders(options),
      },
    }
  );
};

/**
 * Solicita sugerencias de reemplazo para uno o más ejercicios de la rutina activa.
 * Llama a POST /api/Routine/swap-suggestions (modo determinista) o
 * POST /api/Routine/swap-suggestions/ai (modo IA) según `useAI`.
 *
 * @param routineExerciseIds IDs (Guid) de las filas RoutineExercise a reemplazar.
 * @param useAI              true = sugerencias rankeadas por IA (sin warnings, score 0).
 * @param token              Token de autenticación de Clerk.
 */
export const getSwapSuggestions = async (
  routineExerciseIds: string[],
  useAI: boolean,
  token: string | null
): Promise<SwapSuggestionsResponse> => {
  const url = useAI
    ? '/api/Routine/swap-suggestions/ai'
    : '/api/Routine/swap-suggestions';

  try {
    // ⚠️ C# System.Text.Json por defecto espera PascalCase. Usar exacto nombre del DTO.
    const { data } = await apiClient.post<SwapSuggestionsResponse>(
      url,
      { RoutineExerciseIds: routineExerciseIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      logger.error('[routine.service]', url, 'FAIL', error);
    }
    throw error;
  }
};

/**
 * Crea una rutina manualmente con los días y ejercicios configurados por el usuario.
 * Llama al endpoint POST /api/Routine/create-routine.
 * @param payload Datos de la rutina a crear.
 * @param token   Token de autenticación de Clerk.
 */
export const createRoutine = async (
  payload: CreateRoutinePayload,
  token: string | null,
): Promise<Routine> => {
  const url = '/api/Routine/create-routine';
  try {
    const { data } = await apiClient.post<Routine>(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return capitalizeRoutineNames(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Activa una rutina existente como rutina activa del usuario.
 * Llama al endpoint POST /api/Routine/{id}/activate.
 *
 * @param routineId ID de la rutina a activar.
 * @param token     Token de autenticación de Clerk.
 */
export const activateRoutine = async (
  routineId: string,
  token: string | null,
): Promise<Routine> => {
  const url = `/api/Routine/${routineId}/activate`;
  try {
    const { data } = await apiClient.post<Routine>(url, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return capitalizeRoutineNames(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Actualiza una rutina manual existente.
 * Llama al endpoint PUT /api/Routine/{id}.
 *
 * @param routineId ID de la rutina a actualizar.
 * @param payload   Datos actualizados de la rutina.
 * @param token     Token de autenticación de Clerk.
 */
export const updateRoutine = async (
  routineId: string,
  payload: CreateRoutinePayload,
  token: string | null,
  options?: OfflineRequestOptions,
): Promise<Routine> => {
  const url = `/api/Routine/${routineId}`;
  try {
    const { data } = await apiClient.put<Routine>(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...buildOfflineHeaders(options),
      },
    });
    return capitalizeRoutineNames(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Confirma el reemplazo de uno o más ejercicios en la rutina activa.
 * Llama a POST /api/Routine/swap-exercises.
 *
 * @param swaps Pares (routineExerciseId → newExerciseId). Sin duplicados.
 * @param token Token de autenticación de Clerk.
 * @returns     La rutina activa completa actualizada.
 */
export const confirmSwapExercises = async (
  swaps: SwapPick[],
  token: string | null
): Promise<Routine> => {
  const url = '/api/Routine/swap-exercises';

  try {
    const { data } = await apiClient.post<Routine>(
      url,
      { swaps },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return capitalizeRoutineNames(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      logger.error('[routine.service]', url, 'FAIL', error);
    }
    throw error;
  }
};

/**
 * Obtiene todas las rutinas del usuario con paginación.
 * Llama al endpoint GET /api/Routine/my-routines.
 * @param token Token de autenticación de Clerk.
 * @param page Número de página (base 1).
 * @param pageSize Items por página.
 */
export const fetchMyRoutines = async (
  token: string | null,
  page: number = 1,
  pageSize: number = 10,
  signal?: AbortSignal,
): Promise<PagedRoutinesResponse> => {
  const url = '/api/Routine/my-routines';
  try {
    const { data } = await apiClient.get<PagedRoutinesResponse>(url, withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
      params: { page, pageSize },
    }, signal));
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Obtiene una muestra mixta de hasta 5 rutinas AI + 5 rutinas Manual.
 * Llama al endpoint GET /api/Routine/routine-preview.
 * @param token Token de autenticación de Clerk.
 */
export const fetchRoutinePreview = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<RoutinePreviewResponse> => {
  const url = '/api/Routine/routine-preview';
  try {
    const { data } = await apiClient.get<RoutinePreviewResponse>(url, withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal));
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Obtiene una rutina completa por su ID.
 * Llama al endpoint GET /api/Routine/{id}.
 * @param routineId ID de la rutina.
 * @param token Token de autenticación de Clerk.
 */
export const getRoutineById = async (
  routineId: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<Routine> => {
  const url = `/api/Routine/${routineId}`;
  try {
    const { data } = await apiClient.get<Routine>(url, withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal));
    return capitalizeRoutineNames(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Elimina una rutina por ID.
 * DELETE /api/routine/{id}
 * @returns 204 NoContent si la eliminación fue exitosa
 */
export const deleteRoutine = async (routineId: string, token: string): Promise<void> => {
  const url = `/api/routine/${routineId}`;
  try {
    await apiClient.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        throw new Error('La rutina no existe');
      }
      if (error.response?.status === 403) {
        throw new Error('No tenés permiso para eliminar esta rutina');
      }
      if (error.response?.status === 401) {
        throw new Error('Usuario no autenticado');
      }
    }
    throw new Error('No se pudo eliminar la rutina. Intentá de nuevo.');
  }
};

/**
 * Inicia la propuesta de adaptación con IA de una rutina manual.
 * POST /api/routine/{routineId}/adapt-ai
 */
export const adaptRoutineWithAi = async (
  routineId: string,
  token: string | null
): Promise<AdaptRoutineResponseDto> => {
  const { data } = await apiClient.post<AdaptRoutineResponseDto>(
    `/api/routine/${routineId}/adapt-ai`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

/**
 * Confirma la adaptación propuesta, sobreescribiendo la rutina original.
 * POST /api/routine/adaptation/{adaptationId}/confirm
 */
export const confirmRoutineAdaptation = async (
  adaptationId: string,
  token: string | null
): Promise<Routine> => {
  const { data } = await apiClient.post<Routine>(
    `/api/routine/adaptation/${adaptationId}/confirm`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return capitalizeRoutineNames(data);
};

/**
 * Descarta la adaptación propuesta.
 * POST /api/routine/adaptation/{adaptationId}/reject
 */
export const rejectRoutineAdaptation = async (
  adaptationId: string,
  token: string | null
): Promise<void> => {
  await apiClient.post(
    `/api/routine/adaptation/${adaptationId}/reject`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

/* ──────────────────────────── Versionado de rutinas ─────────────────────── */

/**
 * Obtiene el historial de versiones de una rutina (metadata, sin contenido).
 * GET /api/routine/{routineId}/versions
 */
export const getRoutineVersions = async (
  routineId: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<RoutineVersionsResponse> => {
  const url = `/api/Routine/${routineId}/versions`;
  try {
    const { data } = await apiClient.get<RoutineVersionsResponse>(url, withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal));
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Obtiene el contenido completo de una versión concreta.
 * GET /api/routine/{routineId}/versions/{versionId}
 */
export const getRoutineVersionDetail = async (
  routineId: string,
  versionId: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<RoutineVersionDetail> => {
  const url = `/api/Routine/${routineId}/versions/${versionId}`;
  try {
    const { data } = await apiClient.get<RoutineVersionDetail>(url, withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal));
    return capitalizeVersionDetail(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Cambia la versión activa de la rutina (NO crea historial, solo cambia la activa).
 * Refresca los targets de nutrición en el backend.
 * PATCH /api/routine/{routineId}/active-version
 */
export const setActiveRoutineVersion = async (
  routineId: string,
  versionId: string,
  token: string | null
): Promise<RoutineVersionDetail> => {
  const url = `/api/Routine/${routineId}/active-version`;
  try {
    const { data } = await apiClient.patch<RoutineVersionDetail>(
      url,
      { versionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return capitalizeVersionDetail(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Restaura una versión clonándola como una versión NUEVA (queda activa + última).
 * Deja trazabilidad. Sirve para "copiar una versión vieja para editarla".
 * POST /api/routine/{routineId}/versions/{versionId}/restore
 */
export const restoreRoutineVersion = async (
  routineId: string,
  versionId: string,
  token: string | null
): Promise<RoutineVersionDetail> => {
  const url = `/api/Routine/${routineId}/versions/${versionId}/restore`;
  try {
    const { data } = await apiClient.post<RoutineVersionDetail>(
      url,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return capitalizeVersionDetail(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};


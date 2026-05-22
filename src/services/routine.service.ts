import { AxiosError } from 'axios';
import apiClient from '../api/client';
import { Routine, SwapPick, SwapSuggestionsResponse } from '../types/routine';
import { SessionLog } from '../types/session';
import { capitalize } from '../utils/format.utils';

/** Payload de un ejercicio para crear rutina manualmente */
export interface CreateRoutineExercisePayload {
  exerciseId: string;
  order: number;
  sets: number;
  repMode: 'reps' | 'secs';
  reps: number | null;
  durationSeconds: number | null;
  restSeconds: number;
  weightKg: number | null;
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

const capitalizeRoutineNames = (routine: Routine): Routine => ({
  ...routine,
  days: routine.days?.map((day) => ({
    ...day,
    exercises: day.exercises?.map((ex) => ({ ...ex, name: capitalize(ex.name) })) ?? [],
  })) ?? [],
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
  token: string | null
): Promise<Routine | null> => {
  try {
    const { data } = await apiClient.get<Routine>(
      '/api/Routine/active-routine',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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
  token: string | null
): Promise<void> => {
  await apiClient.post(
    '/api/Routine/sessions',
    log,
    {
      headers: {
        Authorization: `Bearer ${token}`,
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
  console.log('[routine.service] POST', url, { routineExerciseIds, hasToken: !!token });

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
    console.log('[routine.service]', url, 'OK', {
      suggestionsCount: data.suggestions?.length,
      hasHealthWarning: data.hasHealthWarning,
      warningLevel: data.warningLevel,
    });
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('[routine.service]', url, 'FAIL', error);
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
      console.error('[routine.service]', url, 'FAIL', {
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
  console.log('[routine.service] POST', url, { swapsCount: swaps.length, swaps, hasToken: !!token });

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
    console.log('[routine.service]', url, 'OK', { routineId: data.id, daysCount: data.days?.length });
    return capitalizeRoutineNames(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('[routine.service]', url, 'FAIL', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('[routine.service]', url, 'FAIL', error);
    }
    throw error;
  }
};

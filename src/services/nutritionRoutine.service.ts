import apiClient from '../api/client';
import type { OfflineRequestOptions } from './routine.service';
import { NutritionDayDto } from '../types/nutrition';
import {
  NutritionRoutineDto,
  PagedNutritionRoutinesResponse,
  RoutineMealDetailDto,
} from '../types/nutritionRoutine';
import { creditsEvents } from '../store/credits-events';
import { withRequestSignal } from '../utils/request-cancellation';
import { InsufficientCreditsError } from './subscription.service';

export interface OfflineNutritionRoutineBundleDto {
  routine: NutritionRoutineDto;
  mealDetails: Record<string, RoutineMealDetailDto>;
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

/** Normaliza respuestas de la API que pueden venir envueltas en { data: ... } */
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

/**
 * Obtiene la rutina alimenticia activa del usuario.
 * Retorna null si no existe rutina activa (404).
 */
export const getActiveNutritionRoutine = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<NutritionRoutineDto | null> => {
  try {
    const { data } = await apiClient.get<NutritionRoutineDto | { data: NutritionRoutineDto }>(
      '/api/nutrition-routine/active',
      withRequestSignal({ headers: { Authorization: `Bearer ${token}` } }, signal),
    );
    return unwrapApiData(data);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) return null;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    throw new Error('No pudimos cargar tu plan de nutrición. Intentá de nuevo.');
  }
};

/**
 * Obtiene el bundle offline del plan activo con detalle/macros/receta de todas las comidas.
 */
export const getOfflineNutritionRoutineBundle = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<OfflineNutritionRoutineBundleDto | null> => {
  try {
    const { data } = await apiClient.get<
      OfflineNutritionRoutineBundleDto | { data: OfflineNutritionRoutineBundleDto }
    >('/api/offline/nutrition/active-routine', withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal));
    return unwrapApiData(data);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) return null;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    throw new Error('No pudimos descargar el plan offline. Intentá de nuevo.');
  }
};

/**
 * Lista paginada de las rutinas alimenticias del usuario (resumen, sin días/comidas).
 * El backend ordena la activa primero y luego las más recientes.
 */
export const fetchMyNutritionRoutines = async (
  token: string | null,
  page: number = 1,
  pageSize: number = 10,
  signal?: AbortSignal,
): Promise<PagedNutritionRoutinesResponse> => {
  try {
    const { data } = await apiClient.get<
      PagedNutritionRoutinesResponse | { data: PagedNutritionRoutinesResponse }
    >(
      '/api/nutrition-routine/my-routines',
      withRequestSignal(
        { headers: { Authorization: `Bearer ${token}` }, params: { page, pageSize } },
        signal,
      ),
    );
    return unwrapApiData(data);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    throw new Error('No pudimos cargar tus planes de nutrición. Intentá de nuevo.');
  }
};

/**
 * Activa una rutina alimenticia por id. Idempotente: si ya estaba activa, no falla.
 * No devuelve cuerpo (204); tras activar conviene refrescar la rutina activa.
 */
export const activateNutritionRoutine = async (
  routineId: string,
  token: string | null,
): Promise<void> => {
  try {
    await apiClient.post(
      `/api/nutrition-routine/${routineId}/activate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    if (status === 404) throw new Error('No se pudo activar este plan. Intentá de nuevo.');
    throw new Error('No pudimos activar tu plan. Intentá de nuevo.');
  }
};

/**
 * Obtiene una rutina alimenticia por id con días y comidas resumidas.
 * `GET /api/nutrition-routine/{id}` devuelve la misma forma que `/active`, pero para
 * cualquier rutina del usuario (Draft/Active/Saved). Payload liviano: las macros y la
 * receta de cada comida se piden bajo demanda con `getRoutineMealDetail`.
 * Para la rutina activa/draft conviene usar el snapshot del contexto y reservar esta
 * llamada a las rutinas históricas.
 */
export const getNutritionRoutineById = async (
  routineId: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<NutritionRoutineDto> => {
  try {
    const { data } = await apiClient.get<NutritionRoutineDto | { data: NutritionRoutineDto }>(
      `/api/nutrition-routine/${routineId}`,
      withRequestSignal({ headers: { Authorization: `Bearer ${token}` } }, signal),
    );
    return unwrapApiData(data);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    if (status === 404) throw new Error('Este plan no existe o no te pertenece.');
    throw new Error('No pudimos cargar el plan. Intentá de nuevo.');
  }
};

/**
 * Genera una nueva rutina alimenticia semanal usando IA.
 * Reemplaza la rutina activa anterior.
 */
export const generateNutritionRoutine = async (
  token: string | null,
): Promise<NutritionRoutineDto> => {
  try {
    const { data } = await apiClient.post<NutritionRoutineDto | { data: NutritionRoutineDto }>(
      '/api/nutrition-routine/generate',
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return unwrapApiData(data);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    // 402 = créditos de IA agotados. Va tipado para que la UI ofrezca comprar créditos
    // en vez del error genérico (generar un plan cuesta créditos).
    if (status === 402) throw new InsufficientCreditsError();
    if (status === 409) throw new Error('Completá la configuración del módulo Nutrición primero.');
    if (status === 404) throw new Error('Tu perfil nutricional no está configurado.');
    throw new Error('No pudimos generar tu plan de nutrición. Intentá de nuevo.');
  } finally {
    creditsEvents.emitWalletChanged();
  }
};

/**
 * Registra una comida del plan de rutina en el log diario.
 * Retorna el NutritionDayDto actualizado con la comida incorporada.
 */
export const logRoutineMeal = async (
  mealId: string,
  date: string,
  token: string | null,
  options?: OfflineRequestOptions,
): Promise<NutritionDayDto> => {
  try {
    const { data } = await apiClient.post<NutritionDayDto | { data: NutritionDayDto }>(
      `/api/nutrition-routine/meals/${mealId}/log`,
      {},
      {
        params: { date },
        headers: {
          Authorization: `Bearer ${token}`,
          ...buildOfflineHeaders(options),
        },
      },
    );
    return unwrapApiData(data);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    if (status === 404) throw new Error('La comida no existe o no te pertenece.');
    if (status === 400) throw new Error('El día nutricional ya está cerrado.');
    throw new Error('No pudimos registrar la comida. Intentá de nuevo.');
  }
};

/**
 * Acepta un Draft de rutina y lo convierte en la rutina activa.
 */
export const acceptNutritionRoutine = async (
  routineId: string,
  token: string | null,
): Promise<NutritionRoutineDto> => {
  try {
    const { data } = await apiClient.post<NutritionRoutineDto | { data: NutritionRoutineDto }>(
      `/api/nutrition-routine/${routineId}/accept`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return unwrapApiData(data);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    if (status === 404) throw new Error('La rutina no existe o no te pertenece.');
    if (status === 400) throw new Error('La rutina ya no está en estado Draft.');
    throw new Error('No pudimos activar tu plan. Intentá de nuevo.');
  }
};

/**
 * Rechaza y elimina un Draft de rutina sin afectar la rutina activa.
 */
export const rejectNutritionRoutine = async (
  routineId: string,
  token: string | null,
): Promise<void> => {
  try {
    await apiClient.delete(`/api/nutrition-routine/${routineId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    if (status === 404) throw new Error('La rutina no existe o no te pertenece.');
    if (status === 400) throw new Error('La rutina ya no está en estado Draft.');
    throw new Error('No pudimos descartar el plan. Intentá de nuevo.');
  }
};

/**
 * Obtiene el detalle de una comida de la rutina activa (macros + receta).
 */
export const getRoutineMealDetail = async (
  mealId: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<RoutineMealDetailDto> => {
  try {
    const { data } = await apiClient.get<RoutineMealDetailDto | { data: RoutineMealDetailDto }>(
      `/api/nutrition-routine/meals/${mealId}`,
      withRequestSignal({ headers: { Authorization: `Bearer ${token}` } }, signal),
    );
    return unwrapApiData(data);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
    if (status === 404) throw new Error('Comida no encontrada.');
    throw new Error('No pudimos cargar el detalle de la comida. Intentá de nuevo.');
  }
};

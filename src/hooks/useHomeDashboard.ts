import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getOfflineFitnessRoutine } from '../offline/service';
import { getActiveRoutine } from '../services/routine.service';
import { fetchTrainingHistory } from '../services/training-history.service';
import {
  postHydrationLog,
  postMoodLog,
  postSleepLog,
} from '../services/wellness.service';
import { bumpWellnessData } from '../store/wellness-sync';
import { Routine } from '../types/routine';
import {
  AddHydrationLogDto,
  AddMoodLogDto,
  AddSleepLogDto,
} from '../types/wellness';
import { logger } from '../utils/logger';
import { getConsumedCalories } from '../utils/nutrition.utils';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';
import { toDateKey } from '../utils/wellness.utils';
import { useNutritionDay } from './useNutritionDay';
import { useWellnessDashboard } from './useWellnessDashboard';

/** Resumen de nutrición de hoy para el home (kcal consumidas vs objetivo). */
interface HomeNutritionSummary {
  consumedCalories: number;
  targetCalories: number;
  hasPlan: boolean;
}

interface UseHomeDashboardReturn {
  /** Rutina activa del usuario, o null si no tiene. */
  routine: Routine | null;
  /** true si ya hay una sesión de entrenamiento con fecha de hoy. */
  trainedToday: boolean;
  /** Carga del bloque de rutina (activa + historial de hoy). */
  isLoadingRoutine: boolean;
  /** Resumen "Hoy" de bienestar (sueño/ánimo/hidratación/meditación). */
  wellness: ReturnType<typeof useWellnessDashboard>['today'];
  isLoadingWellness: boolean;
  /** Resumen de nutrición de hoy. */
  nutrition: HomeNutritionSummary;
  isLoadingNutrition: boolean;
  /** Indica que alguna mutación de registro rápido está en curso. */
  isSubmitting: boolean;
  /** Registra el ánimo de hoy y refresca el bienestar. */
  logMood: (payload: AddMoodLogDto) => Promise<void>;
  /** Registra el sueño de hoy y refresca el bienestar. */
  logSleep: (payload: AddSleepLogDto) => Promise<void>;
  /** Registra hidratación y refresca el bienestar. */
  logHydration: (payload: AddHydrationLogDto) => Promise<void>;
  /** Refresca solo la nutrición del día (para focus tras registrar comida). */
  refreshNutrition: () => void;
  /** Refresca todas las fuentes del home. */
  refresh: () => void;
}

/**
 * Orquesta los datos del dashboard Home: rutina + si entrenó hoy, resumen de
 * bienestar de hoy y nutrición del día. Expone además los registros rápidos
 * (ánimo/sueño/hidratación) que persisten y refrescan el bienestar in situ.
 *
 * Reutiliza los hooks estables del dominio (`useWellnessDashboard`,
 * `useNutritionDay`) en vez de reimplementar sus cargas, y sigue el patrón
 * `getTokenRef` para no meter `getToken` en deps de efectos con setState.
 */
export function useHomeDashboard(): UseHomeDashboardReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const mountedRef = useRef(true);
  const routineRequestRef = useRef<AbortController | null>(null);

  const wellness = useWellnessDashboard();
  const nutritionDay = useNutritionDay();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [trainedToday, setTrainedToday] = useState(false);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRoutine = useCallback(async () => {
    const controller = beginAbortableRequest(routineRequestRef);
    const { signal } = controller;

    setIsLoadingRoutine(true);
    try {
      // Hidratamos rápido desde SQLite solo si el usuario descargó la rutina offline.
      const stored = await getOfflineFitnessRoutine();
      if (stored && mountedRef.current) {
        setRoutine(stored);
      }

      const token = await getTokenRef.current();
      if (signal.aborted) return;
      if (!token) return;

      const [routineResult, historyResult] = await Promise.allSettled([
        getActiveRoutine(token, signal),
        // Las 5 sesiones más recientes alcanzan para saber si entrenó hoy
        // (más robusto que filtrar por fecha en el backend por zona horaria).
        fetchTrainingHistory(
          { fromDate: null, toDate: null, routineId: null, targetMuscle: null },
          1,
          5,
          token,
          signal,
        ),
      ]);

      if (!mountedRef.current || !isCurrentRequest(routineRequestRef, controller)) return;

      if (routineResult.status === 'fulfilled') {
        const fetched = routineResult.value;
        setRoutine(fetched);
      }

      if (historyResult.status === 'fulfilled') {
        const todayKey = toDateKey(new Date());
        setTrainedToday(
          historyResult.value.items.some(
            (session) => toDateKey(session.trainedAt) === todayKey,
          ),
        );
      }
    } catch (error) {
      if (signal.aborted || isRequestCanceled(error)) return;
      logger.error('[useHomeDashboard] Error cargando rutina:', error);
    } finally {
      if (mountedRef.current && isCurrentRequest(routineRequestRef, controller)) {
        setIsLoadingRoutine(false);
      }
      endAbortableRequest(routineRequestRef, controller);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadRoutine();
    return () => {
      mountedRef.current = false;
      abortRequest(routineRequestRef);
    };
  }, [loadRoutine]);

  /** Ejecuta una mutación de bienestar, marca el dirty global y refresca. */
  const runWellnessMutation = useCallback(
    async (mutate: (token: string | null) => Promise<unknown>) => {
      setIsSubmitting(true);
      try {
        const token = await getTokenRef.current();
        await mutate(token);
        bumpWellnessData();
        wellness.refresh();
      } catch (error) {
        logger.error('[useHomeDashboard] Error en registro rápido:', error);
        throw error;
      } finally {
        if (mountedRef.current) setIsSubmitting(false);
      }
    },
    [wellness],
  );

  const logMood = useCallback(
    (payload: AddMoodLogDto) =>
      runWellnessMutation((token) => postMoodLog(payload, token)),
    [runWellnessMutation],
  );

  const logSleep = useCallback(
    (payload: AddSleepLogDto) =>
      runWellnessMutation((token) => postSleepLog(payload, token)),
    [runWellnessMutation],
  );

  const logHydration = useCallback(
    (payload: AddHydrationLogDto) =>
      runWellnessMutation((token) => postHydrationLog(payload, token)),
    [runWellnessMutation],
  );

  const refresh = useCallback(() => {
    loadRoutine();
    wellness.refresh();
    nutritionDay.refresh();
  }, [loadRoutine, wellness, nutritionDay]);

  const nutrition: HomeNutritionSummary = {
    consumedCalories: getConsumedCalories(nutritionDay.day),
    targetCalories: nutritionDay.target?.calories ?? 0,
    hasPlan: nutritionDay.profile != null,
  };

  return {
    routine,
    trainedToday,
    isLoadingRoutine,
    wellness: wellness.today,
    isLoadingWellness: wellness.isLoading,
    nutrition,
    isLoadingNutrition: nutritionDay.isLoading,
    isSubmitting,
    logMood,
    logSleep,
    logHydration,
    refreshNutrition: nutritionDay.refresh,
    refresh,
  };
}

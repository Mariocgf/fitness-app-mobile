import { logger } from '@/src/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getNutritionDay,
  getNutritionProfile,
  getNutritionTargets,
} from '../services/nutrition.service';
import {
  NutritionDayDto,
  NutritionProfileDto,
  NutritionTargetDto,
} from '../types/nutrition';
import {
  createEmptyNutritionDay,
  createTargetFromProfile,
  getTodayDateKey,
} from '../utils/nutrition.utils';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

interface UseNutritionDayReturn {
  date: string;
  day: NutritionDayDto | null;
  profile: NutritionProfileDto | null;
  target: NutritionTargetDto | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  replaceDay: (nextDay: NutritionDayDto) => void;
}

/**
 * Carga el estado nutricional del día sin recalcular objetivos en front.
 */
export function useNutritionDay(requestedDate?: string): UseNutritionDayReturn {
  const { getToken } = useAuth();
  const defaultDateRef = useRef(getTodayDateKey());
  const date = requestedDate ?? defaultDateRef.current;
  const getTokenRef = useRef(getToken);
  const mountedRef = useRef(true);
  const refreshRequestRef = useRef<AbortController | null>(null);

  getTokenRef.current = getToken;

  const [day, setDay] = useState<NutritionDayDto | null>(null);
  const [profile, setProfile] = useState<NutritionProfileDto | null>(null);
  const [target, setTarget] = useState<NutritionTargetDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const controller = beginAbortableRequest(refreshRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;

      const [profileResult, targetsResult, dayResult] = await Promise.allSettled([
        getNutritionProfile(token, signal),
        getNutritionTargets(date, date, token, signal),
        getNutritionDay(date, token, signal),
      ]);

      if (!mountedRef.current || !isCurrentRequest(refreshRequestRef, controller)) return;

      if (profileResult.status === 'rejected') {
        throw profileResult.reason;
      }

      const profileData = profileResult.value;
      const targetsData = targetsResult.status === 'fulfilled' ? targetsResult.value : [];
      const dayData = dayResult.status === 'fulfilled'
        ? dayResult.value
        : createEmptyNutritionDay(date);
      const targetData =
        targetsData.find((item) => item.date === date) ??
        targetsData[0] ??
        createTargetFromProfile(date, profileData);

      if (targetsResult.status === 'rejected') {
        logger.warn('[useNutritionDay] Targets no disponibles, usando profile como fallback:', targetsResult.reason);
      }
      if (dayResult.status === 'rejected') {
        logger.warn('[useNutritionDay] Día nutricional no disponible, usando día vacío:', dayResult.reason);
      }

      setProfile(profileData);
      setTarget(targetData);
      setDay(dayData);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      logger.error('[useNutritionDay] Error:', err);
      if (mountedRef.current) {
        setError('No pudimos cargar tu nutrición. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current && isCurrentRequest(refreshRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(refreshRequestRef, controller);
    }
  }, [date]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
      abortRequest(refreshRequestRef);
    };
  }, [refresh]);

  return {
    date,
    day,
    profile,
    target,
    isLoading,
    error,
    refresh,
    replaceDay: setDay,
  };
}

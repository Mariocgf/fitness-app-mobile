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

  getTokenRef.current = getToken;

  const [day, setDay] = useState<NutritionDayDto | null>(null);
  const [profile, setProfile] = useState<NutritionProfileDto | null>(null);
  const [target, setTarget] = useState<NutritionTargetDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getTokenRef.current();
      const [profileResult, targetsResult, dayResult] = await Promise.allSettled([
        getNutritionProfile(token),
        getNutritionTargets(date, date, token),
        getNutritionDay(date, token),
      ]);

      if (!mountedRef.current) return;

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
        console.warn('[useNutritionDay] Targets no disponibles, usando profile como fallback:', targetsResult.reason);
      }
      if (dayResult.status === 'rejected') {
        console.warn('[useNutritionDay] Día nutricional no disponible, usando día vacío:', dayResult.reason);
      }

      setProfile(profileData);
      setTarget(targetData);
      setDay(dayData);
    } catch (err) {
      console.error('[useNutritionDay] Error:', err);
      if (mountedRef.current) {
        setError('No pudimos cargar tu nutrición. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [date]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
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

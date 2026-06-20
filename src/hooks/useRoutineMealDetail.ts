import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getRoutineMealDetail } from '../services/nutritionRoutine.service';
import { RoutineMealDetailDto } from '../types/nutritionRoutine';

interface UseRoutineMealDetailReturn {
  detail: RoutineMealDetailDto | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Carga el detalle de una comida de la rutina IA (macros + receta).
 * Usa getTokenRef para evitar loops de efectos por identidad cambiante de getToken.
 */
export function useRoutineMealDetail(mealId: string): UseRoutineMealDetailReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const mountedRef = useRef(true);

  getTokenRef.current = getToken;

  const [detail, setDetail] = useState<RoutineMealDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const data = await getRoutineMealDetail(mealId, token);
      if (mountedRef.current) setDetail(data);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message ?? 'No pudimos cargar el detalle. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [mealId]);

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => {
      mountedRef.current = false;
    };
  }, [refetch]);

  return { detail, isLoading, error, refetch };
}

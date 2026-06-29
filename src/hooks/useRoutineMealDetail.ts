import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getRoutineMealDetail } from '../services/nutritionRoutine.service';
import { getOfflineRoutineMealDetail } from '../offline/service';
import { RoutineMealDetailDto } from '../types/nutritionRoutine';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

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
  const detailRequestRef = useRef<AbortController | null>(null);

  getTokenRef.current = getToken;

  const [detail, setDetail] = useState<RoutineMealDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const controller = beginAbortableRequest(detailRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const data = await getRoutineMealDetail(mealId, token, signal);
      if (mountedRef.current && isCurrentRequest(detailRequestRef, controller)) setDetail(data);
    } catch (err: any) {
      if (signal.aborted || isRequestCanceled(err)) return;
      const offlineDetail = await getOfflineRoutineMealDetail(mealId);
      if (offlineDetail) {
        if (mountedRef.current && isCurrentRequest(detailRequestRef, controller)) {
          setDetail(offlineDetail);
          setError(null);
        }
        return;
      }

      if (mountedRef.current && isCurrentRequest(detailRequestRef, controller)) {
        setError(err?.message ?? 'No pudimos cargar el detalle. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current && isCurrentRequest(detailRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(detailRequestRef, controller);
    }
  }, [mealId]);

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => {
      mountedRef.current = false;
      abortRequest(detailRequestRef);
    };
  }, [refetch]);

  return { detail, isLoading, error, refetch };
}

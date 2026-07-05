import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchMyNutritionRoutines } from '../services/nutritionRoutine.service';
import { NutritionRoutineSummaryDto } from '../types/nutritionRoutine';
import { logger } from '../utils/logger';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

interface UseMyNutritionRoutinesReturn {
  routines: NutritionRoutineSummaryDto[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
}

const PAGE_SIZE = 10;

/**
 * Lista las rutinas alimenticias del usuario con paginación.
 * El backend ordena la activa primero y luego las más recientes, así que el orden
 * de llegada se respeta tal cual (no se reordena en el cliente).
 * Usa getTokenRef-style refs de cancelación para evitar respuestas pisadas.
 * Resuelve el token de Clerk fresco en cada fetch para no refetchear cuando
 * Clerk refresca la sesión en segundo plano.
 */
export function useMyNutritionRoutines(): UseMyNutritionRoutinesReturn {
  const { getToken, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [routines, setRoutines] = useState<NutritionRoutineSummaryDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstPageRequestRef = useRef<AbortController | null>(null);
  const loadMoreRequestRef = useRef<AbortController | null>(null);

  const hasMore = useMemo(() => page * PAGE_SIZE < totalCount, [page, totalCount]);

  /** Carga la primera página (o recarga). */
  const loadFirstPage = useCallback(async () => {
    abortRequest(loadMoreRequestRef);
    abortRequest(firstPageRequestRef);

    const token = await getTokenRef.current();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const controller = beginAbortableRequest(firstPageRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    setPage(1);

    try {
      const data = await fetchMyNutritionRoutines(token, 1, PAGE_SIZE, signal);
      if (!isCurrentRequest(firstPageRequestRef, controller)) return;
      setRoutines(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError('No pudimos cargar tus planes. Intentá de nuevo.');
      logger.error('[useMyNutritionRoutines] Error:', err);
    } finally {
      if (isCurrentRequest(firstPageRequestRef, controller)) setIsLoading(false);
      endAbortableRequest(firstPageRequestRef, controller);
    }
  }, []);

  /** Carga la siguiente página y la concatena. */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const token = await getTokenRef.current();
    if (!token) return;

    const controller = beginAbortableRequest(loadMoreRequestRef);
    const { signal } = controller;
    const nextPage = page + 1;

    setIsLoadingMore(true);

    try {
      const data = await fetchMyNutritionRoutines(token, nextPage, PAGE_SIZE, signal);
      if (!isCurrentRequest(loadMoreRequestRef, controller)) return;
      setRoutines((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setTotalCount(data.totalCount);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      logger.error('[useMyNutritionRoutines] Error loading more:', err);
    } finally {
      if (isCurrentRequest(loadMoreRequestRef, controller)) setIsLoadingMore(false);
      endAbortableRequest(loadMoreRequestRef, controller);
    }
  }, [page, isLoadingMore, hasMore]);

  useEffect(() => {
    if (!isSignedIn) return;
    loadFirstPage();
    return () => {
      abortRequest(firstPageRequestRef);
      abortRequest(loadMoreRequestRef);
    };
  }, [isSignedIn, loadFirstPage]);

  return {
    routines,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    refresh: loadFirstPage,
    loadMore,
  };
}

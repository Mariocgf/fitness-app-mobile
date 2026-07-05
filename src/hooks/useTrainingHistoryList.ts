import { logger } from '@/src/utils/logger';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '@/src/utils/request-cancellation';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteTrainingSession, fetchTrainingHistory } from '../services/training-history.service';
import { remove, setMany } from '../store/training-history-cache';
import { TrainingHistoryFilters, TrainingHistorySession } from '../types/training-history';
import { mapHttpErrorToFriendlyMessage } from '../utils/training-history.utils';

const PAGE_SIZE = 10;

interface UseTrainingHistoryListReturn {
  sessions: TrainingHistorySession[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  filters: TrainingHistoryFilters;
  setDateRange: (from: Date | null, to: Date | null) => void;
  setRoutineId: (id: string | null) => void;
  applyFilters: () => void;
  /** Setea el rango de fechas y refetchea en una sola acción (evita stale closure) */
  applyDateRange: (from: Date | null, to: Date | null) => void;
  loadMore: () => void;
  refresh: () => void;
  deleteSession: (id: string) => Promise<boolean>;
}

/**
 * Hook para la lista paginada de historial de entrenamiento con filtros.
 * Resuelve el token de Clerk fresco en cada fetch para no refetchear cuando
 * Clerk refresca la sesión en segundo plano.
 */
export function useTrainingHistoryList(): UseTrainingHistoryListReturn {
  const { getToken, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [sessions, setSessions] = useState<TrainingHistorySession[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<TrainingHistoryFilters>({
    fromDate: null,
    toDate: null,
    routineId: null,
    targetMuscle: null,
  });
  const firstPageRequestRef = useRef<AbortController | null>(null);
  const loadMoreRequestRef = useRef<AbortController | null>(null);

  /** Carga la primera página con los filtros activos */
  const loadFirstPage = useCallback(
    async (activeFilters: TrainingHistoryFilters) => {
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
        const data = await fetchTrainingHistory(activeFilters, 1, PAGE_SIZE, token, signal);
        if (!isCurrentRequest(firstPageRequestRef, controller)) return;
        setSessions(data.items);
        setTotalCount(data.totalCount);
        setMany(data.items);
      } catch (err) {
        if (signal.aborted || isRequestCanceled(err)) return;
        setError(mapHttpErrorToFriendlyMessage(err));
        logger.error('[useTrainingHistoryList] Error:', err);
      } finally {
        if (isCurrentRequest(firstPageRequestRef, controller)) {
          setIsLoading(false);
        }
        endAbortableRequest(firstPageRequestRef, controller);
      }
    },
    [],
  );

  /** Carga más resultados (paginación hacia adelante) */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || page * PAGE_SIZE >= totalCount) return;

    const token = await getTokenRef.current();
    if (!token) return;

    const controller = beginAbortableRequest(loadMoreRequestRef);
    const { signal } = controller;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const data = await fetchTrainingHistory(filters, nextPage, PAGE_SIZE, token, signal);
      if (!isCurrentRequest(loadMoreRequestRef, controller)) return;
      setSessions((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setMany(data.items);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      logger.error('[useTrainingHistoryList] loadMore Error:', err);
    } finally {
      if (isCurrentRequest(loadMoreRequestRef, controller)) {
        setIsLoadingMore(false);
      }
      endAbortableRequest(loadMoreRequestRef, controller);
    }
  }, [isLoadingMore, page, totalCount, filters]);

  const hasMore = useMemo(() => page * PAGE_SIZE < totalCount, [page, totalCount]);

  /** Actualiza solo el rango de fechas en los filtros (sin refetch automático) */
  const setDateRange = useCallback((from: Date | null, to: Date | null) => {
    setFilters((prev) => ({ ...prev, fromDate: from, toDate: to }));
  }, []);

  /** Actualiza solo el routineId en los filtros (sin refetch automático) */
  const setRoutineId = useCallback((id: string | null) => {
    setFilters((prev) => ({ ...prev, routineId: id }));
  }, []);

  /** Aplica los filtros actuales refetcheando desde página 1 */
  const applyFilters = useCallback(() => {
    loadFirstPage(filters);
  }, [loadFirstPage, filters]);

  /**
   * Setea el rango de fechas y refetchea de inmediato con ese valor.
   * Evita el stale closure de hacer `setDateRange` + `applyFilters` por separado.
   */
  const applyDateRange = useCallback(
    (from: Date | null, to: Date | null) => {
      const next: TrainingHistoryFilters = { ...filters, fromDate: from, toDate: to };
      setFilters(next);
      loadFirstPage(next);
    },
    [filters, loadFirstPage],
  );

  /** Limpia filtros y recarga */
  const refresh = useCallback(() => {
    const clean: TrainingHistoryFilters = {
      fromDate: null,
      toDate: null,
      routineId: null,
      targetMuscle: null,
    };
    setFilters(clean);
    loadFirstPage(clean);
  }, [loadFirstPage]);

  /**
   * Elimina una sesión de entrenamiento.
   * Ejecuta el DELETE y actualiza el estado local sin refetch.
   * Retorna true si se eliminó exitosamente.
   */
  const deleteSession = useCallback(
    async (id: string): Promise<boolean> => {
      const token = await getTokenRef.current();
      if (!token) return false;

      try {
        const success = await deleteTrainingSession(id, token);
        if (success) {
          // Actualizar estado local: remover la sesión eliminada
          setSessions((prev) => prev.filter((s) => s.id !== id));
          setTotalCount((prev) => Math.max(0, prev - 1));
          // Remover del cache también
          remove(id);
        }
        return success;
      } catch (err) {
        logger.error('[useTrainingHistoryList] deleteSession Error:', err);
        throw err;
      }
    },
    [],
  );

  useEffect(() => {
    if (!isSignedIn) return;
    loadFirstPage(filters);
    return () => {
      abortRequest(firstPageRequestRef);
      abortRequest(loadMoreRequestRef);
    };
    // Solo al montar / cuando la sesión queda lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  return {
    sessions,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    filters,
    setDateRange,
    setRoutineId,
    applyFilters,
    applyDateRange,
    loadMore,
    refresh,
    deleteSession,
  };
}

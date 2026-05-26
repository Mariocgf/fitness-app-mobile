import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTrainingHistory } from '../services/training-history.service';
import { setMany } from '../store/training-history-cache';
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
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Hook para la lista paginada de historial de entrenamiento con filtros.
 * @param token Token de autenticación de Clerk.
 */
export function useTrainingHistoryList(
  token: string | null,
): UseTrainingHistoryListReturn {
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

  /** Carga la primera página con los filtros activos */
  const loadFirstPage = useCallback(
    async (activeFilters: TrainingHistoryFilters) => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setPage(1);

      try {
        const data = await fetchTrainingHistory(activeFilters, 1, PAGE_SIZE, token);
        setSessions(data.items);
        setTotalCount(data.totalCount);
        setMany(data.items);
      } catch (err) {
        setError(mapHttpErrorToFriendlyMessage(err));
        console.error('[useTrainingHistoryList] Error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [token],
  );

  /** Carga más resultados (paginación hacia adelante) */
  const loadMore = useCallback(async () => {
    if (!token || isLoadingMore || page * PAGE_SIZE >= totalCount) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const data = await fetchTrainingHistory(filters, nextPage, PAGE_SIZE, token);
      setSessions((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setMany(data.items);
    } catch (err) {
      console.error('[useTrainingHistoryList] loadMore Error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [token, isLoadingMore, page, totalCount, filters]);

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

  useEffect(() => {
    loadFirstPage(filters);
    // Solo al montar (token cambia)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    loadMore,
    refresh,
  };
}

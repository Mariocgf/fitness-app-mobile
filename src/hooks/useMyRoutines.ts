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
import { RoutineSummary, RoutineSource } from '../types/routine';
import { fetchMyRoutines } from '../services/routine.service';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface UseMyRoutinesReturn {
  routines: RoutineSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  dateRange: DateRange;
  sourceFilter: 'all' | RoutineSource;
  setDateRange: (range: DateRange) => void;
  setSourceFilter: (filter: 'all' | RoutineSource) => void;
  loadMore: () => void;
  applyFilters: () => void;
  refresh: () => void;
}

const PAGE_SIZE = 10;

/**
 * Hook para obtener todas las rutinas del usuario con paginación y filtros.
 * Los filtros se aplican en el frontend sobre todos los datos cargados.
 * Resuelve el token de Clerk fresco en cada fetch para no refetchear cuando
 * Clerk refresca la sesión en segundo plano.
 */
export function useMyRoutines(): UseMyRoutinesReturn {
  const { getToken, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [allRoutines, setAllRoutines] = useState<RoutineSummary[]>([]);
  const [displayedRoutines, setDisplayedRoutines] = useState<RoutineSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [sourceFilter, setSourceFilter] = useState<'all' | RoutineSource>('all');
  const firstPageRequestRef = useRef<AbortController | null>(null);
  const loadMoreRequestRef = useRef<AbortController | null>(null);

  /** Carga inicial de rutinas */
  const loadRoutines = useCallback(async () => {
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
      const data = await fetchMyRoutines(token, 1, PAGE_SIZE, signal);
      if (!isCurrentRequest(firstPageRequestRef, controller)) return;
      setAllRoutines(data.items);
      setTotalCount(data.totalCount);
      setDisplayedRoutines(data.items);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError('No se pudieron cargar las rutinas. Intentá de nuevo.');
      logger.error('[useMyRoutines] Error:', err);
    } finally {
      if (isCurrentRequest(firstPageRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(firstPageRequestRef, controller);
    }
  }, []);

  /** Cargar más rutinas (paginación) */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const token = await getTokenRef.current();
    if (!token) return;

    const controller = beginAbortableRequest(loadMoreRequestRef);
    const { signal } = controller;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const data = await fetchMyRoutines(token, nextPage, PAGE_SIZE, signal);
      if (!isCurrentRequest(loadMoreRequestRef, controller)) return;
      const newRoutines = [...allRoutines, ...data.items];
      setAllRoutines(newRoutines);
      setPage(nextPage);

      // Re-aplicar filtros sobre los nuevos datos
      const filtered = applyFiltersToData(newRoutines, dateRange, sourceFilter);
      setDisplayedRoutines(filtered.slice(0, nextPage * PAGE_SIZE));
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      logger.error('[useMyRoutines] Error loading more:', err);
    } finally {
      if (isCurrentRequest(loadMoreRequestRef, controller)) {
        setIsLoadingMore(false);
      }
      endAbortableRequest(loadMoreRequestRef, controller);
    }
  }, [page, isLoadingMore, allRoutines, dateRange, sourceFilter]);

  /** Aplicar filtros a los datos */
  const applyFiltersToData = (
    data: RoutineSummary[],
    range: DateRange,
    source: 'all' | RoutineSource
  ): RoutineSummary[] => {
    return data.filter((routine) => {
      // Filtro por source
      if (source !== 'all' && routine.source !== source) {
        return false;
      }

      // Filtro por rango de fechas (usando createdAt)
      if (range.from || range.to) {
        const createdDate = new Date(routine.createdAt);

        if (range.from && createdDate < range.from) {
          return false;
        }

        if (range.to) {
          // Ajustar la fecha "hasta" para incluir todo el día
          const endOfDay = new Date(range.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (createdDate > endOfDay) {
            return false;
          }
        }
      }

      return true;
    });
  };

  /** Aplicar filtros manualmente */
  const applyFilters = useCallback(() => {
    const filtered = applyFiltersToData(allRoutines, dateRange, sourceFilter);
    setDisplayedRoutines(filtered.slice(0, page * PAGE_SIZE));
  }, [allRoutines, dateRange, sourceFilter, page]);

  /** Recargar todo */
  const refresh = useCallback(() => {
    setDateRange({ from: null, to: null });
    setSourceFilter('all');
    loadRoutines();
  }, [loadRoutines]);

  /** Calcular si hay más páginas disponibles */
  const hasMore = useMemo(() => {
    return page * PAGE_SIZE < totalCount;
  }, [page, totalCount]);

  /** Carga inicial */
  useEffect(() => {
    if (!isSignedIn) return;
    loadRoutines();
    return () => {
      abortRequest(firstPageRequestRef);
      abortRequest(loadMoreRequestRef);
    };
  }, [isSignedIn, loadRoutines]);

  /** Re-aplicar filtros cuando cambian */
  useEffect(() => {
    if (allRoutines.length > 0) {
      applyFilters();
    }
  }, [dateRange, sourceFilter]);

  return {
    routines: displayedRoutines,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    page,
    dateRange,
    sourceFilter,
    setDateRange,
    setSourceFilter,
    loadMore,
    applyFilters,
    refresh,
  };
}

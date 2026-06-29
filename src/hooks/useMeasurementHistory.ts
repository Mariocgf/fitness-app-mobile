import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getBodyMeasurements } from '../services/health.service';
import { BodyMeasurementDto } from '../types/health';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

const HISTORY_PAGE_SIZE = 10;

interface UseMeasurementHistoryReturn {
  items: BodyMeasurementDto[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Gestiona la carga paginada del historial completo de mediciones.
 * Diseñado para la pantalla de historial: carga la primera página al montar
 * y permite cargar más mediante loadMore().
 */
export function useMeasurementHistory(): UseMeasurementHistoryReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [items, setItems] = useState<BodyMeasurementDto[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstPageRequestRef = useRef<AbortController | null>(null);
  const loadMoreRequestRef = useRef<AbortController | null>(null);

  const loadFirstPage = useCallback(async () => {
    abortRequest(loadMoreRequestRef);
    const controller = beginAbortableRequest(firstPageRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const result = await getBodyMeasurements(token, 1, HISTORY_PAGE_SIZE, signal);
      if (!isCurrentRequest(firstPageRequestRef, controller)) return;
      setItems(result.items);
      setTotalCount(result.totalCount);
      setCurrentPage(1);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError('No pudimos cargar el historial. Revisá tu conexión e intentá de nuevo.');
    } finally {
      if (isCurrentRequest(firstPageRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(firstPageRequestRef, controller);
    }
  }, []);

  useEffect(() => {
    loadFirstPage();
    return () => {
      abortRequest(firstPageRequestRef);
      abortRequest(loadMoreRequestRef);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    const controller = beginAbortableRequest(loadMoreRequestRef);
    const { signal } = controller;

    setIsLoadingMore(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const result = await getBodyMeasurements(token, currentPage + 1, HISTORY_PAGE_SIZE, signal);
      if (!isCurrentRequest(loadMoreRequestRef, controller)) return;
      setItems(prev => [...prev, ...result.items]);
      setTotalCount(result.totalCount);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError('No pudimos cargar más mediciones. Tocar para reintentar.');
    } finally {
      if (isCurrentRequest(loadMoreRequestRef, controller)) {
        setIsLoadingMore(false);
      }
      endAbortableRequest(loadMoreRequestRef, controller);
    }
  }, [isLoadingMore, currentPage]);

  return {
    items,
    totalCount,
    hasMore: items.length < totalCount,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh: loadFirstPage,
  };
}

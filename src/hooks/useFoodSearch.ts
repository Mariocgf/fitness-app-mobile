import { logger } from '@/src/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { searchFoods } from '../services/nutrition.service';
import { FoodCatalogItemDto } from '../types/nutrition';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

const PAGE_SIZE = 20;

interface UseFoodSearchReturn {
  query: string;
  foods: FoodCatalogItemDto[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasNextPage: boolean;
  setQuery: (query: string) => void;
  loadMore: () => Promise<void>;
  reset: () => void;
}

/**
 * Maneja búsqueda paginada de alimentos del catálogo.
 */
export function useFoodSearch(): UseFoodSearchReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);

  getTokenRef.current = getToken;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [foods, setFoods] = useState<FoodCatalogItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRequestRef = useRef<AbortController | null>(null);
  const loadMoreRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => () => {
    abortRequest(searchRequestRef);
    abortRequest(loadMoreRequestRef);
  }, []);

  useEffect(() => {
    const run = async () => {
      abortRequest(loadMoreRequestRef);

      if (!debouncedQuery) {
        abortRequest(searchRequestRef);
        setFoods((prev) => (prev.length > 0 ? [] : prev));
        setHasNextPage(false);
        setPage((prev) => (prev === 1 ? prev : 1));
        return;
      }

      const controller = beginAbortableRequest(searchRequestRef);
      const { signal } = controller;

      setIsLoading(true);
      setError(null);
      try {
        const token = await getTokenRef.current();
        if (signal.aborted) return;
        const data = await searchFoods(debouncedQuery, 1, PAGE_SIZE, token, signal);
        if (isCurrentRequest(searchRequestRef, controller)) {
          setFoods(data.items);
          setPage(1);
          setHasNextPage(data.hasNextPage ?? data.items.length === PAGE_SIZE);
        }
      } catch (err) {
        if (signal.aborted || isRequestCanceled(err)) return;
        logger.error('[useFoodSearch] Error:', err);
        if (isCurrentRequest(searchRequestRef, controller)) {
          setError('No pudimos buscar alimentos.');
        }
      } finally {
        if (isCurrentRequest(searchRequestRef, controller)) {
          setIsLoading(false);
        }
        endAbortableRequest(searchRequestRef, controller);
      }
    };

    run();
    return () => {
      abortRequest(searchRequestRef);
    };
  }, [debouncedQuery]);

  const loadMore = useCallback(async () => {
    if (!debouncedQuery || isLoadingMore || !hasNextPage) return;

    const controller = beginAbortableRequest(loadMoreRequestRef);
    const { signal } = controller;

    setIsLoadingMore(true);
    try {
      const token = await getTokenRef.current();
      const nextPage = page + 1;
      if (signal.aborted) return;
      const data = await searchFoods(debouncedQuery, nextPage, PAGE_SIZE, token, signal);
      if (!isCurrentRequest(loadMoreRequestRef, controller)) return;
      setFoods((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setHasNextPage(data.hasNextPage ?? data.items.length === PAGE_SIZE);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      logger.error('[useFoodSearch] Error cargando más:', err);
      setError('No pudimos cargar más alimentos.');
    } finally {
      if (isCurrentRequest(loadMoreRequestRef, controller)) {
        setIsLoadingMore(false);
      }
      endAbortableRequest(loadMoreRequestRef, controller);
    }
  }, [debouncedQuery, hasNextPage, isLoadingMore, page]);

  const reset = useCallback(() => {
    abortRequest(searchRequestRef);
    abortRequest(loadMoreRequestRef);
    setQuery('');
    setDebouncedQuery('');
    setFoods((prev) => (prev.length > 0 ? [] : prev));
    setPage((prev) => (prev === 1 ? prev : 1));
    setHasNextPage(false);
    setError(null);
  }, []);

  return {
    query,
    foods,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    setQuery,
    loadMore,
    reset,
  };
}

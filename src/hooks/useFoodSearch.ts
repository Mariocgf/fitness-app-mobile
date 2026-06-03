import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { searchFoods } from '../services/nutrition.service';
import { FoodCatalogItemDto } from '../types/nutrition';

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

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!debouncedQuery) {
        setFoods((prev) => (prev.length > 0 ? [] : prev));
        setHasNextPage(false);
        setPage((prev) => (prev === 1 ? prev : 1));
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = await getTokenRef.current();
        const data = await searchFoods(debouncedQuery, 1, PAGE_SIZE, token);
        if (!cancelled) {
          setFoods(data.items);
          setPage(1);
          setHasNextPage(data.hasNextPage ?? data.items.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error('[useFoodSearch] Error:', err);
        if (!cancelled) setError('No pudimos buscar alimentos.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const loadMore = useCallback(async () => {
    if (!debouncedQuery || isLoadingMore || !hasNextPage) return;

    setIsLoadingMore(true);
    try {
      const token = await getTokenRef.current();
      const nextPage = page + 1;
      const data = await searchFoods(debouncedQuery, nextPage, PAGE_SIZE, token);
      setFoods((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setHasNextPage(data.hasNextPage ?? data.items.length === PAGE_SIZE);
    } catch (err) {
      console.error('[useFoodSearch] Error cargando más:', err);
      setError('No pudimos cargar más alimentos.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [debouncedQuery, hasNextPage, isLoadingMore, page]);

  const reset = useCallback(() => {
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

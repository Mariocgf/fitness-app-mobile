import { fetchMyPosts } from '@/src/services/forum.service';
import { MyForumPostSummary } from '@/src/types/forum';
import { logger } from '@/src/utils/logger';
import { isRequestCanceled } from '@/src/utils/request-cancellation';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 10;

interface UseMyForumPostsResult {
  posts: MyForumPostSummary[];
  /** Carga inicial (primera página, sin datos previos). */
  isLoading: boolean;
  /** Pull-to-refresh en curso. */
  isRefreshing: boolean;
  /** Cargando la siguiente página. */
  isLoadingMore: boolean;
  error: string | null;
  /** Total real del backend (no `posts.length`): sirve para el contador del header. */
  totalCount: number;
  hasNextPage: boolean;
  refresh: () => void;
  loadMore: () => void;
}

/**
 * Publicaciones propias, paginadas (más nuevas primero). Mismo patrón que `useForumFeed`:
 * token por ref estable (no va en deps) y carga inicial única en un `useEffect` de montaje,
 * para no duplicar el fetch con el `useFocusEffect` de la pantalla.
 *
 * No hay `toggleLike` acá: el endpoint no manda `likedByMe` y no te podés likear a vos mismo.
 */
export function useMyForumPosts(): UseMyForumPostsResult {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [posts, setPosts] = useState<MyForumPostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const pageRef = useRef(0);
  const inFlightRef = useRef(false);

  const hasNextPage = posts.length < totalCount;

  const loadPage = useCallback(async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (mode === 'refresh') setIsRefreshing(true);
    else if (mode === 'more') setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);

    try {
      const token = await getTokenRef.current();
      const response = await fetchMyPosts(token, targetPage, PAGE_SIZE);
      pageRef.current = response.page;
      setTotalCount(response.totalCount);
      setPosts((prev) => (targetPage === 1 ? response.items : [...prev, ...response.items]));
    } catch (err) {
      if (isRequestCanceled(err)) return;
      logger.error('[useMyForumPosts] Error cargando tus publicaciones:', err);
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus publicaciones.');
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(() => {
    void loadPage(1, 'refresh');
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (inFlightRef.current || posts.length >= totalCount) return;
    void loadPage(pageRef.current + 1, 'more');
  }, [loadPage, posts.length, totalCount]);

  useEffect(() => {
    void loadPage(1, 'initial');
  }, [loadPage]);

  return { posts, isLoading, isRefreshing, isLoadingMore, error, totalCount, hasNextPage, refresh, loadMore };
}

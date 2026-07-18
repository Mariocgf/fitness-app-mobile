import { toast } from '@/src/components/ui/feedback';
import { fetchFeed, toggleLike as toggleLikeRequest } from '@/src/services/forum.service';
import { ForumPostSummary } from '@/src/types/forum';
import { logger } from '@/src/utils/logger';
import { isRequestCanceled } from '@/src/utils/request-cancellation';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 10;

interface UseForumFeedResult {
  posts: ForumPostSummary[];
  /** Carga inicial (primera página, sin datos previos). */
  isLoading: boolean;
  /** Pull-to-refresh en curso. */
  isRefreshing: boolean;
  /** Cargando la siguiente página. */
  isLoadingMore: boolean;
  error: string | null;
  hasNextPage: boolean;
  refresh: () => void;
  loadMore: () => void;
  /** Toggle de like con UI optimista (revierte si el backend falla). */
  toggleLike: (postId: string) => void;
}

/**
 * Feed paginado del foro. Más nuevos primero. Sigue las lecciones del repo:
 * el token se resuelve por ref estable (no va en deps de effects) y la carga inicial
 * NO se duplica con `useFocusEffect` (solo un `useEffect` de montaje + `refresh` manual).
 */
export function useForumFeed(): UseForumFeedResult {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [posts, setPosts] = useState<ForumPostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  /** Página cargada más reciente (ref para no re-crear `loadMore` en cada cambio). */
  const pageRef = useRef(0);
  /** Evita disparos solapados de carga (refresh/loadMore simultáneos). */
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
      const response = await fetchFeed(token, targetPage, PAGE_SIZE);
      pageRef.current = response.page;
      setTotalCount(response.totalCount);
      setPosts((prev) =>
        targetPage === 1 ? response.items : [...prev, ...response.items],
      );
    } catch (err) {
      if (isRequestCanceled(err)) return;
      logger.error('[useForumFeed] Error cargando el feed:', err);
      setError(err instanceof Error ? err.message : 'No pudimos cargar la comunidad.');
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

  const toggleLike = useCallback((postId: string) => {
    // 1. Optimista: reflejamos el toque al instante (like es status, sin créditos).
    let snapshot: ForumPostSummary | undefined;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        snapshot = p;
        return {
          ...p,
          likedByMe: !p.likedByMe,
          likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
        };
      }),
    );

    // 2. Confirmamos contra el backend y reconciliamos con el total real.
    void (async () => {
      try {
        const token = await getTokenRef.current();
        const result = await toggleLikeRequest(postId, token);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likedByMe: result.liked, likeCount: result.likeCount } : p,
          ),
        );
      } catch (err) {
        // 3. Falló: revertimos al estado previo exacto.
        logger.error('[useForumFeed] Error en like:', err);
        if (snapshot) {
          setPosts((prev) => prev.map((p) => (p.id === postId ? snapshot! : p)));
        }
        toast.error('No pudimos registrar tu like. Intentá de nuevo.');
      }
    })();
  }, []);

  // Carga inicial única (sin duplicar con useFocusEffect — ver lecciones).
  useEffect(() => {
    void loadPage(1, 'initial');
  }, [loadPage]);

  return { posts, isLoading, isRefreshing, isLoadingMore, error, hasNextPage, refresh, loadMore, toggleLike };
}

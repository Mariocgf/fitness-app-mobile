import { getPostDetail } from '@/src/services/forum.service';
import { ForumPostDetail } from '@/src/types/forum';
import { logger } from '@/src/utils/logger';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '@/src/utils/request-cancellation';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseForumPostResult {
  post: ForumPostDetail | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Detalle de un post del foro (con `attachedRoutine` y `flags`). 404 = inexistente u
 * oculto por moderación → se trata igual ("ya no está disponible"). Token por ref estable
 * y request abortable (mismo patrón que el detalle de nutrición).
 */
export function useForumPost(id: string | undefined): UseForumPostResult {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const mountedRef = useRef(true);
  const requestRef = useRef<AbortController | null>(null);

  const [post, setPost] = useState<ForumPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const controller = beginAbortableRequest(requestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const data = await getPostDetail(id, token, signal);
      if (mountedRef.current && isCurrentRequest(requestRef, controller)) setPost(data);
    } catch (err: any) {
      if (signal.aborted || isRequestCanceled(err)) return;
      if (mountedRef.current && isCurrentRequest(requestRef, controller)) {
        logger.error('[useForumPost] Error cargando el detalle:', err);
        setError(err?.message ?? 'Esta publicación ya no está disponible.');
      }
    } finally {
      if (mountedRef.current && isCurrentRequest(requestRef, controller)) setIsLoading(false);
      endAbortableRequest(requestRef, controller);
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
      abortRequest(requestRef);
    };
  }, [load]);

  return { post, isLoading, error, reload: load };
}

import { createComment, fetchComments, isContentBlockedError } from '@/src/services/forum.service';
import { ForumComment } from '@/src/types/forum';
import { logger } from '@/src/utils/logger';
import { isRequestCanceled } from '@/src/utils/request-cancellation';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 10;

interface UseForumCommentsResult {
  comments: ForumComment[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isSubmitting: boolean;
  error: string | null;
  /** Términos marcados por el filtro al comentar (422). Se resaltan en el input. */
  flaggedTerms: string[];
  clearFlagged: () => void;
  hasNextPage: boolean;
  totalCount: number;
  loadMore: () => void;
  /** Crea un comentario. Devuelve true si se publicó (para limpiar el input). */
  submit: (body: string) => Promise<boolean>;
  /** Saca un comentario de la lista (tras denunciarlo y quedar oculto). */
  removeComment: (commentId: string) => void;
}

/**
 * Comentarios de un post (planos, más nuevos primero, paginados). Al crear con éxito
 * refetchea la 1ª página (evita fabricar `authorName`, que el back no devuelve al crear).
 * 422 → expone `flaggedTerms` para resaltar en el input (mismo patrón que crear post).
 */
export function useForumComments(postId: string | undefined): UseForumCommentsResult {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flaggedTerms, setFlaggedTerms] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const pageRef = useRef(0);
  const inFlightRef = useRef(false);

  const hasNextPage = comments.length < totalCount;

  const loadPage = useCallback(async (targetPage: number, mode: 'initial' | 'more') => {
    if (!postId || inFlightRef.current) return;
    inFlightRef.current = true;
    if (mode === 'more') setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const token = await getTokenRef.current();
      const response = await fetchComments(postId, token, targetPage, PAGE_SIZE);
      pageRef.current = response.page;
      setTotalCount(response.totalCount);
      setComments((prev) => (targetPage === 1 ? response.items : [...prev, ...response.items]));
    } catch (err) {
      if (isRequestCanceled(err)) return;
      logger.error('[useForumComments] Error cargando comentarios:', err);
      setError(err instanceof Error ? err.message : 'No pudimos cargar los comentarios.');
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [postId]);

  const loadMore = useCallback(() => {
    if (inFlightRef.current || comments.length >= totalCount) return;
    void loadPage(pageRef.current + 1, 'more');
  }, [loadPage, comments.length, totalCount]);

  const clearFlagged = useCallback(() => {
    setFlaggedTerms((prev) => (prev.length ? [] : prev));
  }, []);

  const submit = useCallback(async (body: string): Promise<boolean> => {
    if (!postId || body.trim().length === 0 || isSubmitting) return false;
    setIsSubmitting(true);
    setError(null);
    setFlaggedTerms([]);
    try {
      const token = await getTokenRef.current();
      await createComment(postId, { body: body.trim() }, token);
      await loadPage(1, 'initial'); // refetch: trae el comentario con datos reales del back
      return true;
    } catch (err) {
      if (isContentBlockedError(err)) {
        setFlaggedTerms(err.flaggedTerms);
        setError(err.message);
      } else {
        logger.error('[useForumComments] Error comentando:', err);
        setError(err instanceof Error ? err.message : 'No pudimos publicar tu comentario.');
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, isSubmitting, loadPage]);

  const removeComment = useCallback((commentId: string) => {
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== commentId);
      if (next.length !== prev.length) setTotalCount((t) => Math.max(0, t - 1));
      return next;
    });
  }, []);

  useEffect(() => {
    void loadPage(1, 'initial');
  }, [loadPage]);

  return {
    comments, isLoading, isLoadingMore, isSubmitting, error,
    flaggedTerms, clearFlagged, hasNextPage, totalCount, loadMore, submit, removeComment,
  };
}

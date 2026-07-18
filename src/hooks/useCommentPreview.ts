import { fetchComments } from '@/src/services/forum.service';
import { ForumComment } from '@/src/types/forum';
import { isRequestCanceled } from '@/src/utils/request-cancellation';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef, useState } from 'react';

/** Cuántos comentarios se muestran de preview en la card del feed. */
const PREVIEW_SIZE = 2;

/**
 * Trae un preview corto de los últimos comentarios de un post para la card del feed.
 * El feed NO devuelve comentarios (solo `commentCount`) y no hay endpoint batch, así que
 * se piden por post — pero solo si hay comentarios y de a `PREVIEW_SIZE`. Como la `FlatList`
 * virtualiza, solo las cards visibles disparan la llamada. Es best-effort: si falla, no muestra
 * nada (no rompe la card).
 */
export function useCommentPreview(postId: string, commentCount: number): ForumComment[] {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [preview, setPreview] = useState<ForumComment[]>([]);

  useEffect(() => {
    if (commentCount <= 0) {
      setPreview((prev) => (prev.length ? [] : prev));
      return;
    }
    let active = true;
    const controller = new AbortController();
    (async () => {
      try {
        const token = await getTokenRef.current();
        const response = await fetchComments(postId, token, 1, PREVIEW_SIZE, controller.signal);
        if (active) setPreview(response.items);
      } catch (err) {
        if (!isRequestCanceled(err)) {
          // Preview best-effort: silenciamos el error para no ensuciar la card.
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [postId, commentCount]);

  return preview;
}

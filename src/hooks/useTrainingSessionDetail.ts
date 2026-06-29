import { logger } from '@/src/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getTrainingSessionById } from '../services/training-history.service';
import { getSession, setSession } from '../store/training-history-cache';
import { TrainingHistorySession } from '../types/training-history';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';
import { mapHttpErrorToFriendlyMessage } from '../utils/training-history.utils';

interface UseTrainingSessionDetailReturn {
  session: TrainingHistorySession | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Obtiene el detalle de una sesión de entrenamiento.
 * Primero consulta el cache en memoria; si no está, hace fetch al backend.
 * @param id    UUID de la sesión.
 * @param token Token de autenticación de Clerk.
 */
export function useTrainingSessionDetail(
  id: string,
  token: string | null,
): UseTrainingSessionDetailReturn {
  const [session, setSessionState] = useState<TrainingHistorySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRequest(loadRequestRef);

    if (!id || !token) {
      setIsLoading(false);
      return;
    }

    // 1. Intentar desde cache (sin fetch)
    const cached = getSession(id);
    if (cached) {
      setSessionState(cached);
      setIsLoading(false);
      return;
    }

    // 2. Fetch al backend
    const controller = beginAbortableRequest(loadRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);

    try {
      const fetched = await getTrainingSessionById(id, token, signal);
      if (!isCurrentRequest(loadRequestRef, controller)) return;
      if (fetched) {
        setSession(fetched);
        setSessionState(fetched);
      } else {
        setError('No encontramos esta sesión de entrenamiento.');
      }
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError(mapHttpErrorToFriendlyMessage(err));
      logger.error('[useTrainingSessionDetail] Error:', err);
    } finally {
      if (isCurrentRequest(loadRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(loadRequestRef, controller);
    }
  }, [id, token]);

  useEffect(() => {
    load();
    return () => {
      abortRequest(loadRequestRef);
    };
  }, [load]);

  const refresh = useCallback(() => {
    // Forzar refetch ignorando cache
    const cached = getSession(id);
    if (cached) {
      // Vaciar entrada del cache para forzar fetch
      setSession({ ...cached, id: cached.id });
    }
    load();
  }, [load, id]);

  return { session, isLoading, error, refresh };
}

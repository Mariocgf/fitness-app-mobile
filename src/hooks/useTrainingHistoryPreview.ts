import { logger } from '@/src/utils/logger';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '@/src/utils/request-cancellation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTrainingHistory } from '../services/training-history.service';
import { setMany } from '../store/training-history-cache';
import { TrainingHistorySession } from '../types/training-history';
import { mapHttpErrorToFriendlyMessage } from '../utils/training-history.utils';

interface UseTrainingHistoryPreviewReturn {
  sessions: TrainingHistorySession[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Obtiene las 5 sesiones más recientes para el preview de la pantalla principal de fitness.
 * @param token Token de autenticación de Clerk.
 */
export function useTrainingHistoryPreview(
  token: string | null,
): UseTrainingHistoryPreviewReturn {
  const [sessions, setSessions] = useState<TrainingHistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRequest(loadRequestRef);

    if (!token) {
      setIsLoading(false);
      return;
    }

    const controller = beginAbortableRequest(loadRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTrainingHistory(
        { fromDate: null, toDate: null, routineId: null, targetMuscle: null },
        1,
        5,
        token,
        signal,
      );
      if (!isCurrentRequest(loadRequestRef, controller)) return;
      setSessions(data.items);
      // Poblar cache para que el detalle no necesite refetch
      setMany(data.items);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError(mapHttpErrorToFriendlyMessage(err));
      logger.error('[useTrainingHistoryPreview] Error:', err);
    } finally {
      if (isCurrentRequest(loadRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(loadRequestRef, controller);
    }
  }, [token]);

  useEffect(() => {
    load();
    return () => {
      abortRequest(loadRequestRef);
    };
  }, [load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { sessions, isLoading, error, refresh };
}

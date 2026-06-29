import { logger } from '@/src/utils/logger';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '@/src/utils/request-cancellation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RoutineSummary } from '../types/routine';
import { fetchRoutinePreview } from '../services/routine.service';

interface UseRoutinePreviewReturn {
  aiRoutines: RoutineSummary[];
  manualRoutines: RoutineSummary[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook para obtener el preview de rutinas (5 AI + 5 Manual).
 * @param token Token de autenticación de Clerk.
 */
export function useRoutinePreview(token: string | null): UseRoutinePreviewReturn {
  const [aiRoutines, setAiRoutines] = useState<RoutineSummary[]>([]);
  const [manualRoutines, setManualRoutines] = useState<RoutineSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);

  const loadPreview = useCallback(async () => {
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
      const data = await fetchRoutinePreview(token, signal);
      if (!isCurrentRequest(loadRequestRef, controller)) return;
      setAiRoutines(data.ai);
      setManualRoutines(data.manual);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError('No se pudieron cargar las rutinas. Intentá de nuevo.');
      logger.error('[useRoutinePreview] Error:', err);
    } finally {
      if (isCurrentRequest(loadRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(loadRequestRef, controller);
    }
  }, [token]);

  useEffect(() => {
    loadPreview();
    return () => {
      abortRequest(loadRequestRef);
    };
  }, [loadPreview]);

  const refresh = useCallback(() => {
    loadPreview();
  }, [loadPreview]);

  return {
    aiRoutines,
    manualRoutines,
    isLoading,
    error,
    refresh,
  };
}

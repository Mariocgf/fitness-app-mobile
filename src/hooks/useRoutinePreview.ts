import { logger } from '@/src/utils/logger';
import { useCallback, useEffect, useState } from 'react';
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

  const loadPreview = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchRoutinePreview(token);
      setAiRoutines(data.ai);
      setManualRoutines(data.manual);
    } catch (err) {
      setError('No se pudieron cargar las rutinas. Intentá de nuevo.');
      logger.error('[useRoutinePreview] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPreview();
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

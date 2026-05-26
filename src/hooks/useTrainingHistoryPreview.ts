import { useCallback, useEffect, useState } from 'react';
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

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTrainingHistory(
        { fromDate: null, toDate: null, routineId: null, targetMuscle: null },
        1,
        5,
        token,
      );
      setSessions(data.items);
      // Poblar cache para que el detalle no necesite refetch
      setMany(data.items);
    } catch (err) {
      setError(mapHttpErrorToFriendlyMessage(err));
      console.error('[useTrainingHistoryPreview] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { sessions, isLoading, error, refresh };
}

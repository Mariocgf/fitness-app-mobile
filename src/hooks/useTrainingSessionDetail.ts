import { useCallback, useEffect, useState } from 'react';
import { getTrainingSessionById } from '../services/training-history.service';
import { getSession, setSession } from '../store/training-history-cache';
import { TrainingHistorySession } from '../types/training-history';
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

  const load = useCallback(async () => {
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
    setIsLoading(true);
    setError(null);

    try {
      const fetched = await getTrainingSessionById(id, token);
      if (fetched) {
        setSession(fetched);
        setSessionState(fetched);
      } else {
        setError('No encontramos esta sesión de entrenamiento.');
      }
    } catch (err) {
      setError(mapHttpErrorToFriendlyMessage(err));
      console.error('[useTrainingSessionDetail] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
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

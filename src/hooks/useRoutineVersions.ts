import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getRoutineVersions } from '../services/routine.service';
import { RoutineVersionsResponse } from '../types/routine';

/**
 * Carga (perezosamente) el historial de versiones de una rutina.
 * Solo dispara el fetch cuando `enabled` pasa a true (p.ej. al abrir el sheet),
 * y usa una ref estable de `getToken` para no recrear el effect en cada render
 * (ver `docs/agent-implementation-lessons.md`: loops por deps inestables).
 */
export function useRoutineVersions(routineId: string, enabled: boolean) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [data, setData] = useState<RoutineVersionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const res = await getRoutineVersions(routineId, token);
      setData(res);
    } catch {
      setError('No se pudieron cargar las versiones.');
    } finally {
      setIsLoading(false);
    }
  }, [routineId]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { data, isLoading, error, reload: load };
}

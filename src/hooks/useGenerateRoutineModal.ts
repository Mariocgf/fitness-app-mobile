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

import { getRoutineGenerationOptions } from '../services/routine.service';
import { RoutineGenerationOptions } from '../types/routine';

interface UseGenerateRoutineModalReturn {
  /** Opciones de pre-carga (lugar/nivel/días/tiempo + info de solo lectura). */
  options: RoutineGenerationOptions | null;
  isLoading: boolean;
  error: string | null;
  /** Vuelve a pedir las opciones (ej: tras cargar equipamiento). */
  refresh: () => void;
}

/**
 * Carga las opciones del modal de generación de rutina (`generation-options`).
 * La generación en sí la orquesta el screen (para cerrar el modal y mostrar la
 * card en "generando"). Sigue el patrón canónico de `useRoutinePreview`:
 * `getTokenRef` (ref, no dependencia) para no refetchear cuando Clerk refresca la
 * sesión, y `AbortController` para descartar respuestas obsoletas.
 */
export function useGenerateRoutineModal(): UseGenerateRoutineModalReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [options, setOptions] = useState<RoutineGenerationOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);

  const loadOptions = useCallback(async () => {
    abortRequest(loadRequestRef);

    const token = await getTokenRef.current();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const controller = beginAbortableRequest(loadRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getRoutineGenerationOptions(token, signal);
      if (!isCurrentRequest(loadRequestRef, controller)) return;
      setOptions(data);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError('No pudimos cargar las opciones de generación. Intentá de nuevo.');
      logger.error('[useGenerateRoutineModal] Error:', err);
    } finally {
      if (isCurrentRequest(loadRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(loadRequestRef, controller);
    }
  }, []);

  useEffect(() => {
    loadOptions();
    return () => {
      abortRequest(loadRequestRef);
    };
  }, [loadOptions]);

  const refresh = useCallback(() => {
    loadOptions();
  }, [loadOptions]);

  return { options, isLoading, error, refresh };
}

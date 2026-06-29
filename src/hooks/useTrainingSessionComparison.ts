import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getTrainingSessionById } from '../services/training-history.service';
import { TrainingHistorySession, TrainingSessionComparison } from '../types/training-history';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';
import { buildTrainingSessionComparison } from '../utils/training-session-comparison.utils';

interface UseTrainingSessionComparisonReturn {
  comparison: TrainingSessionComparison | null;
  isLoadingTarget: boolean;
  targetError: string | null;
  /** Busca la sesión por ID y calcula el diff contra `base`. Disparo on-demand, no en effect. */
  selectTarget: (id: string) => Promise<void>;
  reset: () => void;
}

/**
 * Orquesta el fetch de la sesión a comparar y el cómputo del diff.
 * El fetch se dispara solo al llamar `selectTarget`, nunca en un effect automático.
 */
export function useTrainingSessionComparison(
  base: TrainingHistorySession | null,
): UseTrainingSessionComparisonReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [comparison, setComparison] = useState<TrainingSessionComparison | null>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const targetRequestRef = useRef<AbortController | null>(null);

  const selectTarget = useCallback(
    async (id: string) => {
      if (!base) return;

      const controller = beginAbortableRequest(targetRequestRef);
      const { signal } = controller;

      setIsLoadingTarget(true);
      setTargetError(null);
      setComparison(null);

      try {
        const token = await getTokenRef.current();
        if (signal.aborted) return;
        const target = await getTrainingSessionById(id, token, signal);
        if (!isCurrentRequest(targetRequestRef, controller)) return;
        if (!target) {
          setTargetError('No se encontró la sesión seleccionada. Intentá de nuevo.');
          return;
        }
        setComparison(buildTrainingSessionComparison(base, target));
      } catch (err) {
        if (signal.aborted || isRequestCanceled(err)) return;
        setTargetError('No se pudo obtener la sesión seleccionada. Intentá de nuevo.');
      } finally {
        if (isCurrentRequest(targetRequestRef, controller)) {
          setIsLoadingTarget(false);
        }
        endAbortableRequest(targetRequestRef, controller);
      }
    },
    [base],
  );

  const reset = useCallback(() => {
    abortRequest(targetRequestRef);
    setComparison(null);
    setTargetError(null);
    setIsLoadingTarget(false);
  }, []);

  useEffect(() => () => {
    abortRequest(targetRequestRef);
  }, []);

  return { comparison, isLoadingTarget, targetError, selectTarget, reset };
}

import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getBodyMeasurementById } from '../services/health.service';
import { BodyMeasurementDto, MeasurementComparison } from '../types/health';
import { buildMeasurementComparison } from '../utils/measurement-comparison.utils';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

interface UseMeasurementComparisonReturn {
  comparison: MeasurementComparison | null;
  isLoadingTarget: boolean;
  targetError: string | null;
  /** Busca el registro por ID y calcula el diff contra `base`. Disparo on-demand, no en effect. */
  selectTarget: (id: string) => Promise<void>;
  reset: () => void;
}

/**
 * Orquesta el fetch del registro a comparar y el cómputo del diff.
 * El fetch se dispara solo al llamar `selectTarget`, nunca en un effect automático.
 */
export function useMeasurementComparison(
  base: BodyMeasurementDto | null,
): UseMeasurementComparisonReturn {
  const { getToken } = useAuth();
  // Ref estable para getToken — evita que participe en dependencias de callbacks
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [comparison, setComparison] = useState<MeasurementComparison | null>(null);
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
        const target = await getBodyMeasurementById(id, token, signal);
        if (!isCurrentRequest(targetRequestRef, controller)) return;
        setComparison(buildMeasurementComparison(base, target));
      } catch (err) {
        if (signal.aborted || isRequestCanceled(err)) return;
        setTargetError('No se pudo obtener el registro seleccionado. Intentá de nuevo.');
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

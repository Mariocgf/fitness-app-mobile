import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useRef, useState } from 'react';

import { getTrainingSessionById } from '../services/training-history.service';
import { TrainingHistorySession, TrainingSessionComparison } from '../types/training-history';
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

  const selectTarget = useCallback(
    async (id: string) => {
      if (!base) return;

      setIsLoadingTarget(true);
      setTargetError(null);
      setComparison(null);

      try {
        const token = await getTokenRef.current();
        const target = await getTrainingSessionById(id, token);
        if (!target) {
          setTargetError('No se encontró la sesión seleccionada. Intentá de nuevo.');
          return;
        }
        setComparison(buildTrainingSessionComparison(base, target));
      } catch {
        setTargetError('No se pudo obtener la sesión seleccionada. Intentá de nuevo.');
      } finally {
        setIsLoadingTarget(false);
      }
    },
    [base],
  );

  const reset = useCallback(() => {
    setComparison(null);
    setTargetError(null);
    setIsLoadingTarget(false);
  }, []);

  return { comparison, isLoadingTarget, targetError, selectTarget, reset };
}

import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getBodyEvolutionDashboard } from '../services/health.service';
import { BodyEvolutionDashboardDto } from '../types/health';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

interface UseBodyEvolutionDashboardOptions {
  /** Fecha inicial opcional en formato YYYY-MM-DD. */
  fromDate?: string;
  /** Fecha final opcional en formato YYYY-MM-DD. */
  toDate?: string;
}

interface UseBodyEvolutionDashboardReturn {
  dashboard: BodyEvolutionDashboardDto | null;
  isLoading: boolean;
  error: string | null;
  /** Recarga las series de evolución física desde el backend. */
  refresh: () => void;
}

/**
 * Gestiona las series temporales del dashboard de evolución física.
 * Mantiene getToken y filtros en refs para evitar effects con dependencias inestables.
 */
export function useBodyEvolutionDashboard(
  options: UseBodyEvolutionDashboardOptions = {},
): UseBodyEvolutionDashboardReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const filtersRef = useRef(options);
  filtersRef.current = options;

  const [dashboard, setDashboard] = useState<BodyEvolutionDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);

  /** Carga las métricas de evolución corporal desde el backend. */
  const load = useCallback(async () => {
    const controller = beginAbortableRequest(loadRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const result = await getBodyEvolutionDashboard(token, filtersRef.current, signal);
      if (!isCurrentRequest(loadRequestRef, controller)) return;
      setDashboard(result);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError('No pudimos cargar la evolución física. Intentá nuevamente.');
    } finally {
      if (isCurrentRequest(loadRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(loadRequestRef, controller);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      abortRequest(loadRequestRef);
    };
  }, [load]);

  return {
    dashboard,
    isLoading,
    error,
    refresh: load,
  };
}

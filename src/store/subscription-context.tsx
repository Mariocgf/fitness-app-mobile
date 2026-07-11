import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getMySubscription } from '../services/subscription.service';
import { SubscriptionStatusDto, SubscriptionTier } from '../types/subscription';
import { logger } from '../utils/logger';
import {
  beginAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

/** Clave de cache del último estado conocido (arranque offline-first). */
const SUBSCRIPTION_STATUS_KEY = '@subscription_status';

/**
 * Estado Free por defecto. Sin suscripción NO es un error: el backend devuelve
 * Free con `status: "none"` y el front lo refleja tal cual (regla de oro).
 */
const FREE_STATUS: SubscriptionStatusDto = {
  tier: 'Free',
  status: 'none',
  currentPeriodEnd: null,
  monthlyCredits: 0,
  billingInterval: 'Monthly',
  productId: null,
};

/**
 * Mapa estático tier → módulos desbloqueados. El status DTO (`GET /me`) no trae
 * módulos (viven en `SubscriptionPlanDto`), así que los derivamos del tier sin
 * llamada de red. Reemplazable por el plan real del catálogo en fases posteriores.
 */
const TIER_MODULES: Record<SubscriptionTier, string[]> = {
  Free: [],
  Fitness: ['fitness'],
  Nutrition: ['nutrition'],
  Full: ['fitness', 'nutrition'],
};

interface SubscriptionContextValue {
  /** Estado de suscripción del usuario tal como lo devuelve `GET /me`. */
  status: SubscriptionStatusDto;
  /** Nivel de suscripción actual (atajo de `status.tier`). */
  tier: SubscriptionTier;
  /** Módulos desbloqueados por el tier actual. */
  unlockedModules: string[];
  isLoading: boolean;
  error: string | null;
  /** True si el tier actual desbloquea el módulo indicado (ej. "fitness"). */
  hasModuleAccess: (moduleName: string) => boolean;
  /** Vuelve a consultar `GET /me` contra el backend. */
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  status: FREE_STATUS,
  tier: 'Free',
  unlockedModules: [],
  isLoading: false,
  error: null,
  hasModuleAccess: () => false,
  refresh: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const mountedRef = useRef(true);
  const requestRef = useRef<AbortController | null>(null);

  getTokenRef.current = getToken;

  const [status, setStatus] = useState<SubscriptionStatusDto>(FREE_STATUS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Consulta el estado real de suscripción. Cancelable: descarta respuestas viejas. */
  const refresh = useCallback(async () => {
    setError(null);
    const controller = beginAbortableRequest(requestRef);
    try {
      const token = await getTokenRef.current();
      const next = await getMySubscription(token, controller.signal);
      if (!mountedRef.current || !isCurrentRequest(requestRef, controller)) return;
      setStatus(next);
    } catch (err: any) {
      if (isRequestCanceled(err)) return;
      if (mountedRef.current) {
        setError(err?.message ?? 'No pudimos cargar tu suscripción. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  /** Hidratación al montar: muestra el último estado cacheado y luego sincroniza. */
  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);

    AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY)
      .then((raw) => {
        if (raw && mountedRef.current) setStatus(JSON.parse(raw));
      })
      .catch((e) => logger.error('Error hidratando suscripción:', e))
      .finally(() => {
        refresh();
      });

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  /** Persiste el último estado conocido para el arranque offline-first. */
  useEffect(() => {
    AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, JSON.stringify(status)).catch(() => {});
  }, [status]);

  const unlockedModules = TIER_MODULES[status.tier];

  const hasModuleAccess = useCallback(
    (moduleName: string) => TIER_MODULES[status.tier].includes(moduleName),
    [status.tier],
  );

  const value = useMemo(
    () => ({
      status,
      tier: status.tier,
      unlockedModules,
      isLoading,
      error,
      hasModuleAccess,
      refresh,
    }),
    [status, unlockedModules, isLoading, error, hasModuleAccess, refresh],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscription = () => useContext(SubscriptionContext);

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

import { getCreditsBalance, getMySubscription } from '../services/subscription.service';
import { SubscriptionStatusDto, SubscriptionTier } from '../types/subscription';
import { creditsEvents } from './credits-events';
import { logger } from '../utils/logger';
import {
  beginAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

/**
 * Prefijo de cache del último estado conocido (arranque offline-first). La clave real
 * SIEMPRE lleva el `userId` (`@subscription_status:<userId>`): sin él, la cuenta B
 * hidrataba la suscripción cacheada de la cuenta A. La cache es por usuario, no global.
 */
const SUBSCRIPTION_STATUS_KEY = '@subscription_status';

/** Clave de cache del estado de suscripción para un usuario dado. */
const statusKeyFor = (userId: string | null | undefined) =>
  userId ? `${SUBSCRIPTION_STATUS_KEY}:${userId}` : null;

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
  /**
   * Saldo real del wallet (`GET /credits`). `null` = TODAVÍA NO SE SABE.
   *
   * Nunca usar `0` como default: 0 es un valor con significado propio ("no te queda
   * nada") y mostrarlo sin haberlo confirmado le miente al usuario. Si es `null`, la
   * UI muestra un placeholder, no un número.
   */
  credits: number | null;
  isLoading: boolean;
  error: string | null;
  /** True si el tier actual desbloquea el módulo indicado (ej. "fitness"). */
  hasModuleAccess: (moduleName: string) => boolean;
  /** Vuelve a consultar `GET /me` contra el backend. */
  refresh: () => Promise<void>;
  /** Vuelve a consultar el saldo (`GET /credits`). Llamar tras comprar o consumir IA. */
  refreshCredits: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  status: FREE_STATUS,
  tier: 'Free',
  unlockedModules: [],
  credits: null,
  isLoading: false,
  error: null,
  hasModuleAccess: () => false,
  refresh: async () => {},
  refreshCredits: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { getToken, userId, isLoaded } = useAuth();
  const getTokenRef = useRef(getToken);
  const mountedRef = useRef(true);
  const requestRef = useRef<AbortController | null>(null);
  const creditsRequestRef = useRef<AbortController | null>(null);

  getTokenRef.current = getToken;

  const [status, setStatus] = useState<SubscriptionStatusDto>(FREE_STATUS);
  // `null` = desconocido. NO se cachea en AsyncStorage a propósito: el wallet lo mueve
  // el backend en cada acción de IA, así que un saldo persistido sería un dato viejo
  // presentado como actual. Preferimos "no sé" antes que mentir.
  const [credits, setCredits] = useState<number | null>(null);
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

  /**
   * Consulta el saldo real del wallet. Su fallo NO ensucia el `error` del contexto:
   * si no pudimos traer el saldo, la tarjeta de suscripción tiene que seguir viéndose
   * (el saldo queda en `null` y la UI muestra un placeholder, no un 0 inventado).
   */
  const refreshCredits = useCallback(async () => {
    const controller = beginAbortableRequest(creditsRequestRef);
    try {
      const token = await getTokenRef.current();
      const next = await getCreditsBalance(token, controller.signal);
      if (!mountedRef.current || !isCurrentRequest(creditsRequestRef, controller)) return;
      setCredits(next.balance);
    } catch (err: any) {
      if (isRequestCanceled(err)) return;
      logger.error('Error consultando el saldo de créditos:', err);
      if (mountedRef.current) setCredits(null);
    }
  }, []);

  /** Tracking de montaje del provider (independiente del ciclo de sesión). */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Hidrata y sincroniza CADA VEZ que cambia el usuario (login, logout, cambio de cuenta).
   *
   * El provider vive en el layout raíz y NUNCA se desmonta al cambiar de sesión, así que su
   * estado sobrevive al cambio de cuenta. Sin este efecto, entrar con la cuenta B seguía
   * mostrando la suscripción y los créditos de la cuenta A. La regla: resetear a los defaults
   * ANTES de sincronizar — nunca mostrar los datos del usuario anterior.
   */
  useEffect(() => {
    // Reset inmediato: los datos del usuario anterior no pueden sobrevivir al cambio.
    setStatus(FREE_STATUS);
    setCredits(null);
    setError(null);

    // Clerk todavía no resolvió la sesión: esperamos sin tocar la red.
    if (!isLoaded) return;

    // Sin usuario (logout): quedamos en Free y no consultamos al backend.
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Guarda de cancelación: si el usuario vuelve a cambiar antes de que resuelva la lectura
    // de cache, `stale` evita que la cache del usuario viejo pise el estado del nuevo.
    let stale = false;

    // Hidratación offline-first desde la cache DE ESTE usuario, y luego sincronización real.
    const key = statusKeyFor(userId);
    AsyncStorage.getItem(key!)
      .then((raw) => {
        if (raw && mountedRef.current && !stale) setStatus(JSON.parse(raw));
      })
      .catch((e) => logger.error('Error hidratando suscripción:', e))
      .finally(() => {
        if (stale) return;
        refresh();
        refreshCredits();
      });

    return () => {
      stale = true;
    };
  }, [userId, isLoaded, refresh, refreshCredits]);

  /**
   * Se suscribe al bus: cada vez que una acción de IA toca el wallet, releemos el saldo.
   * Este es el único disparador del contador global además del montaje — el saldo NO se
   * poletea ni se recalcula en el cliente (ver `credits-events.ts`).
   */
  useEffect(() => creditsEvents.subscribe(() => void refreshCredits()), [refreshCredits]);

  /** Persiste el último estado conocido para el arranque offline-first, por usuario. */
  useEffect(() => {
    const key = statusKeyFor(userId);
    // Sin usuario no persistimos: evita reintroducir una cache global compartida entre cuentas.
    if (!key) return;
    AsyncStorage.setItem(key, JSON.stringify(status)).catch(() => {});
  }, [status, userId]);

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
      credits,
      isLoading,
      error,
      hasModuleAccess,
      refresh,
      refreshCredits,
    }),
    [status, unlockedModules, credits, isLoading, error, hasModuleAccess, refresh, refreshCredits],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscription = () => useContext(SubscriptionContext);

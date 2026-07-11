import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getPurchaseProvider } from '@/src/services/purchase';
import { getSubscriptionPlans } from '@/src/services/subscription.service';
import {
  PlanViewModel,
  StoreProduct,
  SubscriptionPlanDto,
} from '@/src/types/subscription';
import { logger } from '@/src/utils/logger';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '@/src/utils/request-cancellation';

interface UsePlansReturn {
  plans: PlanViewModel[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Formatea un precio de referencia del backend igual que el mock adapter
 * (`$XX.XX` para USD, `XX.XX CUR` para el resto). Solo se usa como fallback
 * cuando el store no devuelve el producto.
 */
const formatReferencePrice = (amount: number, currency: string): string =>
  currency === 'USD' ? `$${amount.toFixed(2)}` : `${amount.toFixed(2)} ${currency}`;

/**
 * Resuelve el precio a mostrar de un plan:
 * - Free (`productId: null`) → "Gratis".
 * - Pago → precio localizado del store/emulador (regla Apple/Google).
 * - Si el store no devolvió ese `productId` → degradar al precio de referencia del
 *   backend (no inventar un precio falso, pero tampoco romper la card).
 */
const resolvePrice = (
  plan: SubscriptionPlanDto,
  storeByProductId: Map<string, StoreProduct>,
): string => {
  if (plan.productId === null) return 'Gratis';
  const store = storeByProductId.get(plan.productId);
  if (store) return store.localizedPrice;
  return formatReferencePrice(plan.price, plan.currency);
};

/** Arma el view model del paywall a partir del plan del backend + precio del store. */
const toViewModel = (
  plan: SubscriptionPlanDto,
  storeByProductId: Map<string, StoreProduct>,
): PlanViewModel => ({
  tier: plan.tier,
  name: plan.name,
  monthlyCredits: plan.monthlyCredits,
  billingInterval: plan.billingInterval,
  productId: plan.productId,
  unlockedModules: plan.unlockedModules,
  localizedPrice: resolvePrice(plan, storeByProductId),
});

/**
 * Carga los planes del paywall combinando la estructura del backend (`GET /plans`)
 * con el precio vivo del store/emulador (adapter `getProducts`). Sigue el patrón
 * del repo: token de Clerk fresco por `getTokenRef` + `AbortController`. El precio
 * del store se pide una sola vez; el filtro mensual/anual se hace en memoria.
 */
export function usePlans(): UsePlansReturn {
  const { getToken, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [plans, setPlans] = useState<PlanViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    const token = await getTokenRef.current();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const controller = beginAbortableRequest(requestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);

    try {
      // 1) Estructura de planes del backend (incluye Free con productId null).
      const backendPlans = await getSubscriptionPlans(token, signal);
      if (!isCurrentRequest(requestRef, controller)) return;

      // 2) Precio localizado del store/emulador por productId (regla Apple/Google).
      const productIds = backendPlans
        .map((plan) => plan.productId)
        .filter((id): id is string => id !== null);
      const storeProducts = productIds.length
        ? await getPurchaseProvider().getProducts(productIds)
        : [];
      if (!isCurrentRequest(requestRef, controller)) return;

      // 3) Merge → view models listos para pintar.
      const storeByProductId = new Map(storeProducts.map((product) => [product.productId, product]));
      setPlans(backendPlans.map((plan) => toViewModel(plan, storeByProductId)));
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError('No se pudieron cargar los planes. Intentá de nuevo.');
      logger.error('[usePlans] Error:', err);
    } finally {
      if (isCurrentRequest(requestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(requestRef, controller);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    load();
    return () => abortRequest(requestRef);
  }, [isSignedIn, load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { plans, isLoading, error, refresh };
}

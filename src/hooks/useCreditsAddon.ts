import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from '@/src/components/ui/feedback';
import { getPurchaseProvider, getPurchasePlatform } from '@/src/services/purchase';
import { purchaseCreditsAddon } from '@/src/services/subscription.service';
import {
  CREDITS_ADDON_PRODUCT_ID,
  PurchaseAddonResultDto,
  StoreProduct,
} from '@/src/types/subscription';
import { logger } from '@/src/utils/logger';

interface UseCreditsAddonOptions {
  /** Se dispara cuando el add-on requiere un plan pago (usuario Free): upsell. */
  onNeedPlan?: () => void;
}

interface UseCreditsAddonReturn {
  buyAddon: () => Promise<void>;
  isPurchasing: boolean;
  error: string | null;
  /** Precio del store/emulador (o `null` → la card usa el precio de referencia). */
  product: StoreProduct | null;
  isLoadingProduct: boolean;
  /** Última respuesta del backend (para reflejar `newBalance`). */
  lastResult: PurchaseAddonResultDto | null;
}

/**
 * Detecta si el motivo de `granted: false` es "requiere plan pago" (usuario Free).
 * El backend devuelve un mensaje ES amigable; hacemos match por palabra clave para
 * decidir si además del aviso hay que disparar el upsell al paywall.
 */
const reasonNeedsPaidPlan = (reason: string): boolean => {
  const normalized = reason.toLowerCase();
  return normalized.includes('plan pago') || normalized.includes('suscripción');
};

/** Detecta el caso de idempotencia (retry): el add-on ya se había otorgado. */
const reasonAlreadyGranted = (reason: string): boolean =>
  reason.toLowerCase().includes('ya fue otorgado');

/**
 * Orquesta la compra emulada del add-on de créditos (+10, consumible). Sigue el
 * patrón de `usePurchaseFlow` (token fresco de Clerk vía `getTokenRef`, `try/catch`,
 * mensajes ES amigables) y carga el precio del store en montaje como `usePlans`.
 *
 * Regla del contrato: `granted: false` es un `200`, NO un error. Se ramifica por
 * `reason`. No llamamos `subscription.refresh()`: el add-on no cambia tier/período/
 * `monthlyCredits`. El saldo del wallet tampoco lo tocamos desde acá: `purchaseCreditsAddon`
 * emite en `creditsEvents` y el `SubscriptionProvider` lo relee del backend. Un solo
 * mecanismo para todo lo que mueve el wallet (ver `credits-events.ts`).
 */
export function useCreditsAddon(options?: UseCreditsAddonOptions): UseCreditsAddonReturn {
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // `externalUserId` para el emulador: el userId de Clerk (en prod lo resuelve el SDK).
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const onNeedPlanRef = useRef(options?.onNeedPlan);
  onNeedPlanRef.current = options?.onNeedPlan;

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [lastResult, setLastResult] = useState<PurchaseAddonResultDto | null>(null);

  // Precio del add-on desde el store/emulador (regla Apple/Google). Si el catálogo
  // no lo trae, `product` queda en `null` y la card degrada al precio de referencia.
  useEffect(() => {
    let active = true;

    getPurchaseProvider()
      .getProducts([CREDITS_ADDON_PRODUCT_ID])
      .then((products) => {
        if (!active) return;
        setProduct(products[0] ?? null);
        setIsLoadingProduct(false);
      })
      .catch((err) => {
        if (!active) return;
        setIsLoadingProduct(false);
        logger.error('[useCreditsAddon] No se pudo cargar el precio del add-on:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  const buyAddon = useCallback(async () => {
    logger.log('[useCreditsAddon] buyAddon: inicio');
    setIsPurchasing(true);
    setError(null);

    try {
      // 1) Compra emulada del consumible contra el store/emulador → receipt/token persistido.
      const platform = getPurchasePlatform();
      const result = await getPurchaseProvider().purchase(
        CREDITS_ADDON_PRODUCT_ID,
        platform,
        userIdRef.current ?? undefined,
      );
      logger.log('[useCreditsAddon] receipt/token obtenido:', result);

      // 2) Acreditación contra el backend (idempotente: revalidar no duplica).
      const token = await getTokenRef.current();
      logger.log('[useCreditsAddon] token Clerk obtenido:', Boolean(token));
      const addonResult = await purchaseCreditsAddon(result, token);
      logger.log('[useCreditsAddon] respuesta backend:', addonResult);
      setLastResult(addonResult);

      // 3) Reflejar el resultado. `granted: false` es 200, NO error: ramificar por reason.
      if (addonResult.granted) {
        toast.success(
          `¡Listo! Sumaste +${addonResult.creditsAdded} créditos. Saldo: ${addonResult.newBalance}.`,
        );
        return;
      }

      const reason = addonResult.reason ?? 'No pudimos acreditar el add-on.';
      if (reasonNeedsPaidPlan(reason)) {
        // Usuario Free: avisar y llevar al paywall (upsell).
        toast.info(reason);
        onNeedPlanRef.current?.();
      } else if (reasonAlreadyGranted(reason)) {
        // Idempotencia: la misma compra ya se había acreditado; el saldo ya lo incluye.
        toast.info(reason);
      } else {
        // Compra inválida o no confirmada por el proveedor.
        toast.warning(reason);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Algo salió mal con la compra. Reintentá en un momento.';
      setError(message);
      toast.error(message);
      logger.error('[useCreditsAddon] Error:', err);
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  return { buyAddon, isPurchasing, error, product, isLoadingProduct, lastResult };
}

import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useRef, useState } from 'react';

import { getPurchaseProvider, getPurchasePlatform } from '@/src/services/purchase';
import { validatePurchase } from '@/src/services/subscription.service';
import { useSubscription } from '@/src/store/subscription-context';
import { toast } from '@/src/components/ui/feedback';
import { PlanViewModel } from '@/src/types/subscription';
import { logger } from '@/src/utils/logger';

interface UsePurchaseFlowReturn {
  purchase: (plan: PlanViewModel) => Promise<void>;
  isPurchasing: boolean;
  error: string | null;
}

/**
 * Orquesta la compra emulada de un plan: dispara el adapter (`provider.purchase`),
 * valida el receipt contra el backend (`POST /validate`) y refresca el contexto
 * para reflejar el nuevo tier. Sigue el patrón del repo (token fresco de Clerk vía
 * `getTokenRef`, `try/catch`, mensajes ES amigables). No usa `AbortController`:
 * es una acción disparada por el usuario, no un fetch en montaje.
 *
 * Regla de oro: el front NO concede acceso; solo refleja lo que devuelve el backend.
 * Un `200` con `status: pending | invalid | expired` NO es error de red — se avisa
 * sin conceder acceso.
 */
export function usePurchaseFlow(): UsePurchaseFlowReturn {
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // Identidad del comprador para el emulador (`externalUserId`). En prod el SDK del
  // store la resuelve solo; en dev la exige el emulador, así que usamos el userId de Clerk.
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const subscription = useSubscription();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(
    async (plan: PlanViewModel) => {
      // Free no se compra: no tiene productId contra el store.
      if (plan.productId === null) return;

      setIsPurchasing(true);
      setError(null);

      try {
        // 1) Compra emulada contra el store/emulador → receipt/token persistido.
        const platform = getPurchasePlatform();
        const result = await getPurchaseProvider().purchase(
          plan.productId,
          platform,
          userIdRef.current ?? undefined,
        );

        // 2) Validación contra el backend (idempotente: revalidar no duplica).
        const token = await getTokenRef.current();
        const status = await validatePurchase(result, token);

        // 3) Reflejar el estado que devolvió el backend (no decidir acá).
        switch (status.status) {
          case 'active':
            await subscription.refresh();
            toast.success(`¡Compra confirmada! Ya tenés el plan ${status.tier}.`);
            break;
          case 'pending':
            // Compra reconocida pero sin confirmar: no se concede acceso todavía.
            toast.info('Tu compra está en proceso. Te avisamos cuando se confirme.');
            break;
          case 'invalid':
          case 'expired':
          case 'none':
          default:
            // 200 sin acceso: no es error de red, pero no se concede nada.
            toast.warning('No pudimos validar la compra. No se aplicó ningún cambio.');
            break;
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Algo salió mal con la compra. Reintentá en un momento.';
        setError(message);
        toast.error(message);
        logger.error('[usePurchaseFlow] Error:', err);
      } finally {
        setIsPurchasing(false);
      }
    },
    [subscription],
  );

  return { purchase, isPurchasing, error };
}

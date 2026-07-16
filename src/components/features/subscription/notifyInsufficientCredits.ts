import { router } from 'expo-router';

import { toast } from '@/src/components/ui/feedback';

/** Paywall: ahí vive la `CreditsAddonCard` para comprar el add-on de créditos. */
const SUBSCRIPTION_ROUTE = '/profile/subscription';

/** Más que el default (5s): el usuario tiene que leer y llegar a tocar el CTA. */
const CREDITS_TOAST_DURATION = 10000;

/**
 * Único punto donde se notifica el 402 (créditos de IA agotados).
 *
 * Los handlers de acciones de IA lo llaman al atrapar un `InsufficientCreditsError`
 * en vez de disparar el `toast.error` genérico: ese mensaje miente sobre la causa
 * ("algo salió mal") y deja al usuario sin salida. Acá le decimos qué pasó y le
 * damos el camino para resolverlo.
 *
 * @param message Mensaje contextual: qué acción concreta no se pudo completar.
 */
export const notifyInsufficientCredits = (
  message = 'Te quedaste sin créditos para esta acción.',
): void => {
  toast.error(message, {
    title: 'Sin créditos',
    duration: CREDITS_TOAST_DURATION,
    action: {
      label: 'Comprar créditos',
      onPress: () => router.push(SUBSCRIPTION_ROUTE),
    },
  });
};

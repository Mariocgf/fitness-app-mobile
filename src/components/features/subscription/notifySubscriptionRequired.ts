import { router } from 'expo-router';

import { toast } from '@/src/components/ui/feedback';

/** Paywall: ahí el usuario ve/activa el plan que incluye el módulo faltante. */
const SUBSCRIPTION_ROUTE = '/profile/subscription';

/** Más que el default (5s): el usuario tiene que leer y llegar a tocar el CTA. */
const SUBSCRIPTION_TOAST_DURATION = 10000;

/**
 * Único punto donde se notifica el 403 de gating por plan (función de IA no incluida
 * en la suscripción actual, ej. módulo Fitness/Nutrición).
 *
 * Los handlers de acciones de IA lo llaman al atrapar el 403 en vez del `toast.error`
 * genérico ("algo salió mal"): ese mensaje esconde la causa real (no es un fallo, es un
 * límite del plan) y deja al usuario sin salida. Acá le decimos qué le falta y le damos
 * el camino para resolverlo.
 *
 * @param message Mensaje del backend (ya viene en ES y nombra el módulo concreto).
 */
export const notifySubscriptionRequired = (
  message = 'Esta función requiere un plan que la incluya.',
): void => {
  toast.error(message, {
    title: 'Plan no incluido',
    duration: SUBSCRIPTION_TOAST_DURATION,
    action: {
      label: 'Ver planes',
      onPress: () => router.push(SUBSCRIPTION_ROUTE),
    },
  });
};

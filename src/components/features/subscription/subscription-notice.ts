import { SubscriptionStatusValue } from '@/src/types/subscription';

/**
 * Aviso accionable sobre el estado de la suscripción.
 *
 * `warning` = todavía conserva el plan (o puede recuperarlo sin urgencia).
 * `danger`  = ya perdió el acceso.
 */
export interface SubscriptionNotice {
  tone: 'warning' | 'danger';
  title: string;
  body: string;
}

/**
 * Decide qué avisarle al usuario sobre su suscripción, o `null` si no hay nada que decir.
 *
 * Se decide con `hasAccess` + `requiresPaymentUpdate`, NO leyendo `status` suelto: el mismo
 * problema de cobro tiene urgencia y mensaje distintos según si el usuario todavía conserva
 * el plan (período de gracia) o ya lo perdió (billing retry).
 *
 * El caso que motivó esto es la GRACIA: la store ya no pudo cobrar, pero le sigue dando acceso
 * unos días. Sin aviso, el único síntoma para el usuario es que un día el plan desaparece sin
 * explicación —y para entonces ya no hay nada que pueda hacer.
 *
 * Es una función pura: recibe el estado y devuelve el mensaje. Nada de red ni de formato visual.
 */
export const buildSubscriptionNotice = (
  status: SubscriptionStatusValue,
  hasAccess: boolean,
  requiresPaymentUpdate: boolean,
  formattedPeriodEnd: string | null,
): SubscriptionNotice | null => {
  // El backend deriva `requiresPaymentUpdate` de estos mismos estados, así que en la práctica
  // van juntos. Se aceptan las DOS señales igual: si alguna vez se desincronizaran, el usuario
  // tiene que enterarse de que le está fallando el cobro — es el aviso más caro de perder.
  const cobroFallando =
    requiresPaymentUpdate || status === 'graceperiod' || status === 'billingretry';

  // Período de gracia: NO perdió nada todavía y tiene una fecha límite concreta.
  if (cobroFallando && hasAccess) {
    return {
      tone: 'warning',
      title: 'No pudimos cobrar tu suscripción',
      body: formattedPeriodEnd
        ? `Actualizá tu medio de pago antes del ${formattedPeriodEnd} para no perder tu plan.`
        : 'Actualizá tu medio de pago para no perder tu plan.',
    };
  }

  // Billing retry: ya sin acceso, pero todavía recuperable.
  if (cobroFallando) {
    return {
      tone: 'danger',
      title: 'Perdiste el acceso a tu plan',
      body: 'El cobro falló. Actualizá tu medio de pago para recuperarlo.',
    };
  }

  // Canceló la renovación: conserva el plan hasta que termine el período que ya pagó.
  if (status === 'cancelled') {
    return {
      tone: 'warning',
      title: 'Cancelaste la renovación',
      body: formattedPeriodEnd
        ? `Mantenés tu plan hasta el ${formattedPeriodEnd}.`
        : 'Mantenés tu plan hasta que termine el período actual.',
    };
  }

  if (status === 'paused') {
    return {
      tone: 'warning',
      title: 'Tu suscripción está pausada',
      body: 'Reanudala desde la tienda para volver a usar tu plan.',
    };
  }

  if (status === 'refunded' || status === 'revoked') {
    return {
      tone: 'danger',
      title: 'Tu suscripción fue dada de baja',
      body: 'Se canceló el acceso a tu plan. Podés volver a suscribirte cuando quieras.',
    };
  }

  if (status === 'expired') {
    return {
      tone: 'warning',
      title: 'Tu plan venció',
      body: 'Renovalo para recuperar tus beneficios.',
    };
  }

  // El backend activa la compra solo cuando la tienda confirma: no hay nada que reintentar.
  if (status === 'pending') {
    return {
      tone: 'warning',
      title: 'Tu compra está en proceso',
      body: 'Te avisamos apenas la tienda la confirme.',
    };
  }

  // `active` y `none` no necesitan aviso: uno está todo bien, el otro nunca compró nada.
  return null;
};

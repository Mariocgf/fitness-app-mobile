import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { FullPageLoader } from '@/src/components/common/FullPageLoader';
import { GradientText } from '@/src/components/common/GradientText';
import { IconTile } from '@/src/components/common/IconTile';
import { useSubscription } from '@/src/store/subscription-context';
import {
  BillingInterval,
  SubscriptionStatusValue,
  SubscriptionTier,
} from '@/src/types/subscription';

/** Acento premium puntual (violeta → índigo) para el clímax de un plan pago. */
const PREMIUM_GRADIENT = ['#a78bfa', '#818cf8'] as const;

/** Etiqueta legible del plan (ej. "Plan Fitness", "Plan Free"). */
const tierLabel = (tier: SubscriptionTier): string => `Plan ${tier}`;

/** Etiqueta ES del estado de la suscripción. */
const statusLabel = (status: SubscriptionStatusValue): string => {
  switch (status) {
    case 'active':
      return 'Activa';
    case 'pending':
      return 'Pendiente';
    case 'expired':
      return 'Vencida';
    case 'invalid':
      return 'Inválida';
    case 'none':
    default:
      return 'Sin plan activo';
  }
};

/** Etiqueta ES del ciclo de cobro. */
const billingLabel = (interval: BillingInterval): string =>
  interval === 'Annual' ? 'Anual' : 'Mensual';

/** Formatea una fecha ISO al formato corto del repo. `null` → no se muestra. */
const formatPeriodEnd = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Fila de detalle (etiqueta izquierda, valor derecha). */
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View className="flex-row items-center justify-between py-3 border-t border-zinc-800">
    <Text className="text-sm text-zinc-500">{label}</Text>
    <Text className="text-sm font-medium text-zinc-200">{value}</Text>
  </View>
);

/**
 * Tarjeta con el estado real de suscripción (`GET /me`). Refleja lo que devuelve
 * el backend sin inventar: si no hay período activo (`currentPeriodEnd: null`),
 * no muestra fecha. Acento premium solo cuando el tier no es Free.
 */
export const SubscriptionStatusCard: React.FC = () => {
  const { status, isLoading, error, refresh } = useSubscription();

  if (isLoading) {
    return <FullPageLoader message="Cargando tu suscripción…" />;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#a1a1aa" />
        <Text className="mt-4 text-center text-base text-zinc-300">{error}</Text>
        <Pressable
          onPress={refresh}
          className="mt-6 rounded-2xl bg-zinc-50 px-6 py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-base font-semibold text-zinc-950">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const isPremium = status.tier !== 'Free';

  return (
    <View className="px-5 pt-5">
      <View className="rounded-3xl bg-zinc-900 p-5">
        {/* Encabezado: tier con acento premium si corresponde */}
        <View className="flex-row items-center">
          <IconTile name="diamond-outline" color={isPremium ? '#a78bfa' : '#a1a1aa'} />
          <View className="ml-4 flex-1">
            {isPremium ? (
              <GradientText className="text-xl font-bold" colors={PREMIUM_GRADIENT}>
                {tierLabel(status.tier)}
              </GradientText>
            ) : (
              <Text className="text-xl font-bold text-zinc-100">{tierLabel(status.tier)}</Text>
            )}
            <Text className="mt-0.5 text-sm text-zinc-500">{statusLabel(status.status)}</Text>
          </View>
        </View>

        {/* Detalle del período y créditos */}
        <View className="mt-4">
          {status.currentPeriodEnd ? (
            <DetailRow
              label={status.status === 'active' ? 'Renueva' : 'Vence'}
              value={formatPeriodEnd(status.currentPeriodEnd)}
            />
          ) : null}
          <DetailRow label="Créditos mensuales" value={String(status.monthlyCredits)} />
          {isPremium ? (
            <DetailRow label="Ciclo de cobro" value={billingLabel(status.billingInterval)} />
          ) : null}
        </View>
      </View>
    </View>
  );
};

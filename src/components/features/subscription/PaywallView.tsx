import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GradientText } from '@/src/components/common/GradientText';
import { usePlans } from '@/src/hooks/usePlans';
import { BillingInterval, PlanViewModel } from '@/src/types/subscription';

import { BillingIntervalToggle } from './BillingIntervalToggle';
import { PlanCard } from './PlanCard';
import { PlanCardSkeleton } from './PlanCardSkeleton';

/** Acento premium puntual (violeta → índigo) para el clímax "Premium". */
const PREMIUM_GRADIENT = ['#a78bfa', '#818cf8'] as const;

interface PaywallViewProps {
  /**
   * Se invoca al confirmar la selección con "Elegir plan". La pantalla dueña
   * abre la hoja de compra (`MockPurchaseSheet`) fuera del `ScrollView` para que
   * el overlay cubra la pantalla; ver `subscription.tsx`.
   */
  onChoosePlan?: (plan: PlanViewModel) => void;
}

/**
 * Paywall: compara los planes disponibles combinando la estructura del backend
 * (`GET /plans`) con el precio vivo del store/emulador. La selección es única y
 * el CTA "Elegir plan" delega la compra en la pantalla vía `onChoosePlan`.
 */
export const PaywallView: React.FC<PaywallViewProps> = ({ onChoosePlan }) => {
  const { plans, isLoading, error, refresh } = usePlans();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('Monthly');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Filtro estricto por ciclo de cobro (el contrato manda variantes separadas).
  const visiblePlans = useMemo(
    () => plans.filter((plan) => plan.billingInterval === billingInterval),
    [plans, billingInterval],
  );

  if (isLoading) {
    return (
      <View className="gap-3 px-5 pt-8">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center px-8 py-12">
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

  const handleChoosePlan = () => {
    // El CTA está deshabilitado sin selección, así que acá siempre hay un plan.
    const selectedPlan = visiblePlans.find((plan) => plan.productId === selectedProductId);
    if (selectedPlan) onChoosePlan?.(selectedPlan);
  };

  return (
    <View className="px-5 pt-8">
      {/* Header premium: "Premium" con acento de gradiente */}
      <View className="mb-5">
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-zinc-100">Pasate a </Text>
          <GradientText className="text-2xl font-bold" colors={PREMIUM_GRADIENT}>
            Premium
          </GradientText>
        </View>
        <Text className="mt-1 text-sm text-zinc-500">Elegí el plan que mejor se adapte a vos.</Text>
      </View>

      <BillingIntervalToggle value={billingInterval} onChange={setBillingInterval} />

      {/* Lista de planes del ciclo elegido — selección única */}
      <View className="mt-5 gap-3">
        {visiblePlans.map((plan) => (
          <PlanCard
            key={`${plan.tier}-${plan.billingInterval}`}
            plan={plan}
            isSelected={plan.productId !== null && plan.productId === selectedProductId}
            onPress={() => setSelectedProductId(plan.productId)}
          />
        ))}
      </View>

      {/* CTA — Fase 2: deshabilitado sin selección; compra real en Fase 3 */}
      <Pressable
        onPress={handleChoosePlan}
        disabled={selectedProductId === null}
        className={`mt-6 items-center rounded-2xl px-6 py-4 ${
          selectedProductId === null ? 'bg-zinc-800' : 'bg-zinc-50'
        }`}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text
          className={`text-base font-semibold ${
            selectedProductId === null ? 'text-zinc-500' : 'text-zinc-950'
          }`}
        >
          Elegir plan
        </Text>
      </Pressable>
    </View>
  );
};

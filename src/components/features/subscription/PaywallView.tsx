import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GradientText } from '@/src/components/common/GradientText';
import { SegmentedControl, SegmentedOption } from '@/src/components/common/SegmentedControl';
import { usePlans } from '@/src/hooks/usePlans';
import { useSubscription } from '@/src/store/subscription-context';
import { BillingInterval, PlanViewModel, SubscriptionTier } from '@/src/types/subscription';
import { computeAnnualSavingsPercent } from '@/src/utils/pricing';

import { BillingOptionRow } from './BillingOptionRow';
import { PaywallSkeleton } from './PaywallSkeleton';
import { PlanFeatureList } from './PlanFeatureList';

/** Acento premium puntual (violeta → índigo) para el clímax "Premium". */
const PREMIUM_GRADIENT = ['#a78bfa', '#818cf8'] as const;

/** Orden de presentación de los tiers pagos (de más acotado a más completo). */
const TIER_ORDER: SubscriptionTier[] = ['Fitness', 'Nutrition', 'Full'];

/** Etiqueta ES del tier para el selector. */
const TIER_LABEL: Record<SubscriptionTier, string> = {
  Free: 'Free',
  Fitness: 'Fitness',
  Nutrition: 'Nutrición',
  Full: 'Full',
};

/** El anual primero: es el que conviene y el que lleva el badge de ahorro. */
const INTERVAL_ORDER: BillingInterval[] = ['Annual', 'Monthly'];

interface PaywallViewProps {
  /**
   * Se invoca al confirmar la selección con "Suscribirme". La pantalla dueña abre la
   * hoja de compra (`MockPurchaseSheet`) fuera del `ScrollView` para que el overlay
   * cubra la pantalla; ver `subscription.tsx`.
   */
  onChoosePlan?: (plan: PlanViewModel) => void;
}

/**
 * Paywall: primero se elige el PLAN (tier), que define los beneficios; después el
 * CICLO de cobro (anual/mensual) dentro de ese plan. Un solo CTA cierra el flujo.
 *
 * Free no aparece: no es una compra, es el estado por defecto, y el plan vigente ya
 * lo muestra `SubscriptionStatusCard` arriba en la misma pantalla.
 */
export const PaywallView: React.FC<PaywallViewProps> = ({ onChoosePlan }) => {
  const { plans, isLoading, error, refresh } = usePlans();
  const { status } = useSubscription();
  const [pickedTier, setPickedTier] = useState<SubscriptionTier | null>(null);
  const [pickedInterval, setPickedInterval] = useState<BillingInterval>('Annual');

  /**
   * Plan ya contratado, por `productId` (identidad del store) y NO por tier: Fitness
   * Mensual y Fitness Anual son productos distintos, así que ocultar el tier entero le
   * sacaría al usuario el pase a anual. Solo cuenta si la suscripción está ACTIVA:
   * vencida o inválida tiene que poder volver a comprarse.
   */
  const ownedProductId = status.status === 'active' ? status.productId : null;

  // Free (`productId: null`) no se ofrece: no se compra.
  const paidPlans = useMemo(() => plans.filter((plan) => plan.productId !== null), [plans]);

  const tiers = useMemo(
    () => TIER_ORDER.filter((tier) => paidPlans.some((plan) => plan.tier === tier)),
    [paidPlans],
  );

  /**
   * El tier se deriva, no se sincroniza con un effect: si todavía no se eligió (o el
   * elegido ya no está en la lista), se arranca en el que el usuario tiene contratado
   * —para que vea su camino de upgrade— y si no, en el primero disponible.
   */
  const activeTier = useMemo(() => {
    if (pickedTier !== null && tiers.includes(pickedTier)) return pickedTier;
    return tiers.find((tier) => tier === status.tier) ?? tiers[0] ?? null;
  }, [pickedTier, tiers, status.tier]);

  // TODOS los planes del tier (incluido el ya contratado): el ahorro anual se calcula
  // contra el precio mensual real, exista o no como opción comprable ahora mismo.
  const tierPlans = useMemo(
    () => paidPlans.filter((plan) => plan.tier === activeTier),
    [paidPlans, activeTier],
  );

  const savingsPercent = useMemo(() => {
    const monthly = tierPlans.find((plan) => plan.billingInterval === 'Monthly');
    const annual = tierPlans.find((plan) => plan.billingInterval === 'Annual');
    if (!monthly || !annual) return null;
    return computeAnnualSavingsPercent(monthly.amount, annual.amount);
  }, [tierPlans]);

  // Opciones comprables: el plan vigente no se vuelve a ofrecer.
  const billingOptions = useMemo(
    () =>
      INTERVAL_ORDER.map((interval) =>
        tierPlans.find(
          (plan) => plan.billingInterval === interval && plan.productId !== ownedProductId,
        ),
      ).filter((plan): plan is PlanViewModel => plan !== undefined),
    [tierPlans, ownedProductId],
  );

  /**
   * La selección se resuelve SIEMPRE contra la lista visible. Al cambiar de tier —o al
   * desaparecer el plan recién comprado— el ciclo elegido puede quedar huérfano, y sin
   * esto el CTA quedaba habilitado apuntando a un plan que ya no está.
   */
  const selectedPlan = useMemo(
    () =>
      billingOptions.find((plan) => plan.billingInterval === pickedInterval) ??
      billingOptions[0] ??
      null,
    [billingOptions, pickedInterval],
  );

  /**
   * Los beneficios son del TIER, no del ciclo, así que se pueden mostrar aunque no
   * quede ninguna opción comprable (ej. el usuario ya tiene la única variante del plan).
   */
  const featurePlan = selectedPlan ?? tierPlans[0] ?? null;

  const tierOptions: SegmentedOption<SubscriptionTier>[] = useMemo(
    () => tiers.map((tier) => ({ label: TIER_LABEL[tier], value: tier })),
    [tiers],
  );

  if (isLoading) {
    return (
      <View className="px-5 pt-8">
        <PaywallSkeleton />
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

  // Sin planes pagos no hay paywall que mostrar (el estado vigente ya está arriba).
  if (activeTier === null || featurePlan === null) return null;

  const handleSubscribe = () => {
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

      {/* 1) Plan: define los beneficios de abajo */}
      <SegmentedControl<SubscriptionTier>
        options={tierOptions}
        value={activeTier}
        onChange={setPickedTier}
        accent="mono"
      />

      {/* 2) Qué trae el plan elegido */}
      <View className="mt-5">
        <PlanFeatureList plan={featurePlan} />
      </View>

      {/* 3) Ciclo de cobro dentro de ese plan */}
      {billingOptions.length > 0 ? (
        <View className="mt-5 gap-3">
          {billingOptions.map((plan) => (
            <BillingOptionRow
              key={plan.productId}
              plan={plan}
              isSelected={plan.productId === selectedPlan?.productId}
              savingsPercent={plan.billingInterval === 'Annual' ? savingsPercent : null}
              onPress={() => setPickedInterval(plan.billingInterval)}
            />
          ))}
        </View>
      ) : (
        <Text className="mt-5 text-center text-sm text-zinc-500">
          Ya tenés este plan activo.
        </Text>
      )}

      {/* CTA — abre la hoja de compra (Fase 3) con el plan + ciclo elegidos */}
      <Pressable
        onPress={handleSubscribe}
        disabled={selectedPlan === null}
        className={`mt-6 items-center rounded-2xl px-6 py-4 ${
          selectedPlan === null ? 'bg-zinc-800' : 'bg-zinc-50'
        }`}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text
          className={`text-base font-semibold ${
            selectedPlan === null ? 'text-zinc-500' : 'text-zinc-950'
          }`}
        >
          Suscribirme
        </Text>
      </Pressable>

      <Text className="mt-3 text-center text-xs text-zinc-600">
        Se cobra a través de tu tienda. Podés cancelar cuando quieras.
      </Text>
    </View>
  );
};

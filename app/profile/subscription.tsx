import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';
import { MockPurchaseSheet } from '@/src/components/features/subscription/MockPurchaseSheet';
import { PaywallView } from '@/src/components/features/subscription/PaywallView';
import { SubscriptionStatusCard } from '@/src/components/features/subscription/SubscriptionStatusCard';
import { usePurchaseFlow } from '@/src/hooks/usePurchaseFlow';
import { PlanViewModel } from '@/src/types/subscription';

/**
 * Ruta de Suscripción dentro del Perfil: el estado real de `GET /me` (Fase 1)
 * seguido del paywall de comparación de planes (Fase 2) y el flujo de compra
 * emulado (Fase 3).
 *
 * La hoja de compra (`MockPurchaseSheet`) se renderiza como **hermano** del
 * `ScrollView` para que su overlay absoluto cubra la pantalla en vez de quedar
 * atrapado (y scrollear) dentro del contenido.
 */
export default function SubscriptionProfileScreen() {
  const insets = useSafeAreaInsets();
  const { purchase, isPurchasing } = usePurchaseFlow();
  const [sheetPlan, setSheetPlan] = useState<PlanViewModel | null>(null);

  return (
    <ProfileSectionScreen title="Suscripción">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <SubscriptionStatusCard />
        <PaywallView onChoosePlan={setSheetPlan} />
      </ScrollView>

      {sheetPlan ? (
        <MockPurchaseSheet
          plan={sheetPlan}
          isPurchasing={isPurchasing}
          onConfirm={() => purchase(sheetPlan)}
          onDismiss={() => setSheetPlan(null)}
        />
      ) : null}
    </ProfileSectionScreen>
  );
}

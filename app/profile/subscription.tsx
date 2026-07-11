import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';
import { PaywallView } from '@/src/components/features/subscription/PaywallView';
import { SubscriptionStatusCard } from '@/src/components/features/subscription/SubscriptionStatusCard';

/**
 * Ruta de Suscripción dentro del Perfil: el estado real de `GET /me` (Fase 1)
 * seguido del paywall de comparación de planes (Fase 2).
 */
export default function SubscriptionProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ProfileSectionScreen title="Suscripción">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <SubscriptionStatusCard />
        <PaywallView />
      </ScrollView>
    </ProfileSectionScreen>
  );
}

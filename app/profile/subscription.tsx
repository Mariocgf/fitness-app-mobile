import React from 'react';

import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';
import { SubscriptionStatusCard } from '@/src/components/features/subscription/SubscriptionStatusCard';

/** Ruta de Suscripción dentro del Perfil: muestra el estado real de `GET /me`. */
export default function SubscriptionProfileScreen() {
  return (
    <ProfileSectionScreen title="Suscripción">
      <SubscriptionStatusCard />
    </ProfileSectionScreen>
  );
}

import { useRouter } from 'expo-router';
import React from 'react';

import { ConditionsConfig } from '@/src/components/features/profile/InjuriesConfig';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta del config de afecciones médicas (Salud) dentro del Perfil. */
export default function HealthConditionsScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Afecciones médicas">
      <ConditionsConfig onBack={() => router.back()} />
    </ProfileSectionScreen>
  );
}

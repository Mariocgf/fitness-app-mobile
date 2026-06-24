import { useRouter } from 'expo-router';
import React from 'react';

import InjuriesConfig from '@/src/components/features/profile/InjuriesConfig';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta del config de lesiones (Salud) dentro del Perfil. */
export default function HealthInjuriesScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Lesiones">
      <InjuriesConfig onBack={() => router.back()} />
    </ProfileSectionScreen>
  );
}

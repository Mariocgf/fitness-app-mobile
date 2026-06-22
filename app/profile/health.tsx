import { useRouter } from 'expo-router';
import React from 'react';

import { HealthSettingsView } from '@/src/components/features/profile/HealthSettingsView';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta de configuración del módulo Salud dentro del Perfil. */
export default function HealthProfileScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Salud">
      {({ onSubBackChange }) => (
        <HealthSettingsView onBack={() => router.back()} onSubBackChange={onSubBackChange} />
      )}
    </ProfileSectionScreen>
  );
}

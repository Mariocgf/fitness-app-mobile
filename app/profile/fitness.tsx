import { useRouter } from 'expo-router';
import React from 'react';

import { FitnessSettingsView } from '@/src/components/features/profile/FitnessSettingsView';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta de configuración del módulo Fitness dentro del Perfil. */
export default function FitnessProfileScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Fitness">
      {({ onSubBackChange }) => (
        <FitnessSettingsView onBack={() => router.back()} onSubBackChange={onSubBackChange} />
      )}
    </ProfileSectionScreen>
  );
}

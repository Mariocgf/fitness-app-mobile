import { useRouter } from 'expo-router';
import React from 'react';

import { NutritionSettingsView } from '@/src/components/features/profile/NutritionSettingsView';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta de configuración del módulo Nutrición dentro del Perfil. */
export default function NutritionProfileScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Nutrición">
      {({ onSubBackChange }) => (
        <NutritionSettingsView onBack={() => router.back()} onSubBackChange={onSubBackChange} />
      )}
    </ProfileSectionScreen>
  );
}

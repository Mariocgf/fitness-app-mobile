import React from 'react';

import { NutritionSettingsView } from '@/src/components/features/profile/NutritionSettingsView';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta de configuración del módulo Nutrición dentro del Perfil (lista de opciones). */
export default function NutritionProfileScreen() {
  return (
    <ProfileSectionScreen title="Nutrición">
      <NutritionSettingsView />
    </ProfileSectionScreen>
  );
}

import React from 'react';

import { FitnessSettingsView } from '@/src/components/features/profile/FitnessSettingsView';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta de configuración del módulo Fitness dentro del Perfil (lista de opciones). */
export default function FitnessProfileScreen() {
  return (
    <ProfileSectionScreen title="Fitness">
      <FitnessSettingsView />
    </ProfileSectionScreen>
  );
}

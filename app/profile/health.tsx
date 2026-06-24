import React from 'react';

import { HealthSettingsView } from '@/src/components/features/profile/HealthSettingsView';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta de configuración del módulo Salud dentro del Perfil (lista de opciones). */
export default function HealthProfileScreen() {
  return (
    <ProfileSectionScreen title="Salud">
      <HealthSettingsView />
    </ProfileSectionScreen>
  );
}

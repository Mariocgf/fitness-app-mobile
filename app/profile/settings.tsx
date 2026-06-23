import React from 'react';

import DataManagement from '@/src/components/features/profile/DataManagement';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta de Configuración (gestión de datos) dentro del Perfil. */
export default function SettingsProfileScreen() {
  return (
    <ProfileSectionScreen title="Configuración">
      <DataManagement />
    </ProfileSectionScreen>
  );
}

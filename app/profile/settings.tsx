import { useRouter } from 'expo-router';
import React from 'react';

import DataManagement from '@/src/components/features/profile/DataManagement';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta de Configuración (gestión de datos) dentro del Perfil. */
export default function SettingsProfileScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Configuración">
      {() => <DataManagement onBack={() => router.back()} />}
    </ProfileSectionScreen>
  );
}

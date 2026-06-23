import { useRouter } from 'expo-router';
import React from 'react';

import EquipmentConfig from '@/src/components/features/profile/EquipmentConfig';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta del config de equipamiento (Fitness) dentro del Perfil. */
export default function FitnessEquipmentScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Equipamiento">
      <EquipmentConfig onBack={() => router.back()} />
    </ProfileSectionScreen>
  );
}

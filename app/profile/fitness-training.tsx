import { useRouter } from 'expo-router';
import React from 'react';

import FitnessTrainingPreferencesConfig from '@/src/components/features/profile/FitnessTrainingPreferencesConfig';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta del config de días y duración (Fitness) dentro del Perfil. */
export default function FitnessTrainingScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Días y duración">
      <FitnessTrainingPreferencesConfig onBack={() => router.back()} />
    </ProfileSectionScreen>
  );
}

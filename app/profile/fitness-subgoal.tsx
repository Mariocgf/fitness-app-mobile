import { useRouter } from 'expo-router';
import React from 'react';

import FitnessSubGoalConfig from '@/src/components/features/profile/FitnessSubGoalConfig';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta del config de sub objetivo (Fitness) dentro del Perfil. */
export default function FitnessSubGoalScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Sub objetivo">
      <FitnessSubGoalConfig onBack={() => router.back()} />
    </ProfileSectionScreen>
  );
}

import { useRouter } from 'expo-router';
import React from 'react';

import DietaryConfig from '@/src/components/features/profile/DietaryConfig';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';

/** Ruta del config de estilo de dieta (Nutrición) dentro del Perfil. */
export default function NutritionDietaryScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Estilo de dieta">
      <DietaryConfig onBack={() => router.back()} />
    </ProfileSectionScreen>
  );
}

import { useRouter } from 'expo-router';
import React from 'react';

import NutritionSelectionConfig from '@/src/components/features/profile/NutritionSelectionConfig';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';
import { getFoodAllergies } from '@/src/services/nutrition.service';
import {
    getUserFoodAllergies,
    updateUserFoodAllergies,
} from '@/src/services/profile.service';

/** Ruta del config de alergias alimentarias (Nutrición) dentro del Perfil. */
export default function NutritionAllergyScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Alergias alimenticias">
      <NutritionSelectionConfig
        fetchCatalog={getFoodAllergies}
        fetchSelected={getUserFoodAllergies}
        save={updateUserFoodAllergies}
        cardTitle="¿Tienes alguna alergia?"
        searchPlaceholder="Buscar alergia"
        successMessage="Alergias alimentarias actualizadas correctamente."
        guardMessage="Tenés cambios pendientes en tus alergias. ¿Querés salir sin guardar?"
        onBack={() => router.back()}
      />
    </ProfileSectionScreen>
  );
}

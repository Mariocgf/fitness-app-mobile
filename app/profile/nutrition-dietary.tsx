import { useRouter } from 'expo-router';
import React from 'react';

import NutritionSelectionConfig from '@/src/components/features/profile/NutritionSelectionConfig';
import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';
import { getDietaryPreferences } from '@/src/services/nutrition.service';
import {
    getUserTypeOfDiets,
    updateUserTypeOfDiets,
} from '@/src/services/profile.service';

/** Ruta del config de estilo de dieta (Nutrición) dentro del Perfil. */
export default function NutritionDietaryScreen() {
  const router = useRouter();
  return (
    <ProfileSectionScreen title="Estilo de dieta">
      <NutritionSelectionConfig
        fetchCatalog={getDietaryPreferences}
        fetchSelected={getUserTypeOfDiets}
        save={updateUserTypeOfDiets}
        cardTitle="¿Sigues algún estilo de dieta?"
        searchPlaceholder="Buscar estilo de dieta"
        successMessage="Estilo de dieta actualizado correctamente."
        guardMessage="Tenés cambios pendientes en tu estilo de dieta. ¿Querés salir sin guardar?"
        onBack={() => router.back()}
      />
    </ProfileSectionScreen>
  );
}

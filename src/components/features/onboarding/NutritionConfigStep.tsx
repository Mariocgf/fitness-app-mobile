import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import NutritionAllergyStep from '@/src/components/features/onboarding/NutritionAllergyStep';
import NutritionDietStyleStep from '@/src/components/features/onboarding/NutritionDietStyleStep';
import NutritionSubGoalStep from '@/src/components/features/onboarding/NutritionSubGoalStep';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import {
    getDietaryPreferences,
    getFoodAllergies,
    getSubGoals,
    submitNutritionProfile,
} from '@/src/services/nutrition.service';
import { NutritionItem, SubGoal } from '@/src/types/nutrition';

interface NutritionConfigStepProps {
  /** Color de marca del módulo Nutrition */
  brandColor: string;
  /** ID del módulo actual */
  moduleId: string;
  /** Nombre de la meta global elegida */
  globalGoalName: string;
  /** Callback al finalizar toda la configuración */
  onComplete: () => void;
  /** Indica si se está enviando al backend */
  isSubmitting: boolean;
  /** Setter para controlar el estado de envío desde el padre */
  setIsSubmitting: (v: boolean) => void;
}

/**
 * Orquestador del módulo Nutrition durante el onboarding.
 * Gestiona estado global y delega el render a:
 *   - NutritionSubGoalStep (subStep 0)
 *   - NutritionDietStep    (subStep 1 → POST)
 */
export default function NutritionConfigStep({
  brandColor,
  moduleId,
  onComplete,
  isSubmitting,
  setIsSubmitting,
}: NutritionConfigStepProps) {
  const { getToken } = useAuth();
  const { saveNutritionConfig, loadNutritionConfig } = useModuleConfigStorage();

  const [subStep, setSubStep] = useState(0);
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [allergies, setAllergies] = useState<NutritionItem[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<NutritionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubGoalIds, setSelectedSubGoalIds] = useState<string[]>([]);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<string[]>([]);
  const [selectedDietIds, setSelectedDietIds] = useState<string[]>([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();
        const [subGoalsData, allergiesData, dietData] = await Promise.all([
          getSubGoals(moduleId, token),
          getFoodAllergies(token),
          getDietaryPreferences(token),
        ]);
        setSubGoals(Array.isArray(subGoalsData) ? subGoalsData : []);
        setAllergies(Array.isArray(allergiesData) ? allergiesData : []);
        setDietaryPreferences(Array.isArray(dietData) ? dietData : []);

        const draft = await loadNutritionConfig();
        if (draft) {
          if (draft.selectedSubGoalIds?.length)
            setSelectedSubGoalIds(draft.selectedSubGoalIds);
          if (draft.allergyIds?.length)
            setSelectedAllergyIds(draft.allergyIds);
          if (draft.dietaryPreferenceIds?.length)
            setSelectedDietIds(draft.dietaryPreferenceIds);
        }
      } catch (e) {
        console.error('Error inicializando Nutrition config:', e);
        alert('No se pudieron cargar los datos de nutrición.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    saveNutritionConfig({
      selectedSubGoalIds,
      allergyIds: selectedAllergyIds,
      dietaryPreferenceIds: selectedDietIds,
    });
  }, [selectedSubGoalIds, selectedAllergyIds, selectedDietIds]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await submitNutritionProfile(
        {
          allergyIds: selectedAllergyIds,
          dietaryPreferenceIds: selectedDietIds,
          subGoals: selectedSubGoalIds,
        },
        token
      );
      onComplete();
    } catch (error) {
      console.error('Error enviando perfil de nutrición:', error);
      alert('Hubo un error al guardar los datos de nutrición.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubGoal = (id: string) => {
    setSelectedSubGoalIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={brandColor} />
        <Text className="text-slate-500 dark:text-slate-400 mt-4">
          Cargando datos de nutrición...
        </Text>
      </View>
    );
  }

  // ── SubStep 0: Sub-objetivos ──
  if (subStep === 0) {
    return (
      <NutritionSubGoalStep
        subGoals={subGoals}
        selectedSubGoalIds={selectedSubGoalIds}
        onToggleSubGoal={toggleSubGoal}
        onContinue={() => setSubStep(1)}
      />
    );
  }

  // ── SubStep 1: Alergias ──
  if (subStep === 1) {
    return (
      <NutritionAllergyStep
        allergies={allergies}
        selectedAllergyIds={selectedAllergyIds}
        onAllergyChange={setSelectedAllergyIds}
        onContinue={() => setSubStep(2)}
        onBack={() => setSubStep(0)}
      />
    );
  }

  // ── SubStep 2: Estilo de dieta → POST ──
  return (
    <NutritionDietStyleStep
      dietaryPreferences={dietaryPreferences}
      selectedDietIds={selectedDietIds}
      onDietChange={setSelectedDietIds}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onBack={() => setSubStep(1)}
    />
  );
}

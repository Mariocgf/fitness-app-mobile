import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import NutritionAllergyStep from '@/src/components/features/onboarding/NutritionAllergyStep';
import NutritionActivityLevelStep from '@/src/components/features/onboarding/NutritionActivityLevelStep';
import NutritionDietStyleStep from '@/src/components/features/onboarding/NutritionDietStyleStep';
import NutritionSubGoalStep from '@/src/components/features/onboarding/NutritionSubGoalStep';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import {
    getDietaryPreferences,
    getFoodAllergies,
    getSubGoals,
    submitNutritionProfile,
} from '@/src/services/nutrition.service';
import { ActivityLevel, NutritionItem, SubGoal } from '@/src/types/nutrition';

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
  const getTokenRef = useRef(getToken);
  const loadNutritionConfigRef = useRef(loadNutritionConfig);
  const saveNutritionConfigRef = useRef(saveNutritionConfig);

  getTokenRef.current = getToken;
  loadNutritionConfigRef.current = loadNutritionConfig;
  saveNutritionConfigRef.current = saveNutritionConfig;

  const [subStep, setSubStep] = useState(0);
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [allergies, setAllergies] = useState<NutritionItem[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<NutritionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubGoalId, setSelectedSubGoalId] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<string[]>([]);
  const [selectedDietIds, setSelectedDietIds] = useState<string[]>([]);
  const [isDraftReady, setIsDraftReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const token = await getTokenRef.current();
        const [subGoalsData, allergiesData, dietData] = await Promise.all([
          getSubGoals(moduleId, token),
          getFoodAllergies(token),
          getDietaryPreferences(token),
        ]);
        if (cancelled) return;

        setSubGoals(Array.isArray(subGoalsData) ? subGoalsData : []);
        setAllergies(Array.isArray(allergiesData) ? allergiesData : []);
        setDietaryPreferences(Array.isArray(dietData) ? dietData : []);

        const draft = await loadNutritionConfigRef.current();
        if (cancelled) return;

        if (draft) {
          if (draft.selectedSubGoalId)
            setSelectedSubGoalId(draft.selectedSubGoalId);
          if (draft.activityLevel)
            setActivityLevel(draft.activityLevel);
          if (draft.allergyIds?.length)
            setSelectedAllergyIds(draft.allergyIds);
          if (draft.dietaryPreferenceIds?.length)
            setSelectedDietIds(draft.dietaryPreferenceIds);
        }
      } catch (e) {
        console.error('Error inicializando Nutrition config:', e);
        alert('No se pudieron cargar los datos de nutrición.');
      } finally {
        if (!cancelled) {
          setIsDraftReady(true);
          setIsLoading(false);
        }
      }
    };
    initialize();
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  useEffect(() => {
    if (!isDraftReady) return;

    saveNutritionConfigRef.current({
      selectedSubGoalId,
      activityLevel,
      allergyIds: selectedAllergyIds,
      dietaryPreferenceIds: selectedDietIds,
    });
  }, [
    selectedSubGoalId,
    activityLevel,
    selectedAllergyIds,
    selectedDietIds,
    isDraftReady,
  ]);

  const handleSubmit = async () => {
    if (!selectedSubGoalId) {
      alert('Por favor selecciona un sub objetivo de nutrición.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await submitNutritionProfile(
        {
          allergyIds: selectedAllergyIds,
          dietaryPreferenceIds: selectedDietIds,
          subGoalId: selectedSubGoalId,
          activityLevel,
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

  const handleContinueSubGoal = () => {
    if (!selectedSubGoalId) {
      alert('Por favor selecciona un sub objetivo de nutrición.');
      return;
    }
    setSubStep(1);
  };

  const handleContinueActivity = () => {
    if (!activityLevel) {
      alert('Por favor selecciona tu nivel de actividad.');
      return;
    }
    setSubStep(2);
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
        selectedSubGoalId={selectedSubGoalId}
        onSelectSubGoal={setSelectedSubGoalId}
        onContinue={handleContinueSubGoal}
      />
    );
  }

  // ── SubStep 1: Nivel de actividad ──
  if (subStep === 1) {
    return (
      <NutritionActivityLevelStep
        activityLevel={activityLevel}
        onSelectActivityLevel={setActivityLevel}
        onContinue={handleContinueActivity}
        onBack={() => setSubStep(0)}
      />
    );
  }

  // ── SubStep 2: Alergias ──
  if (subStep === 2) {
    return (
      <NutritionAllergyStep
        allergies={allergies}
        selectedAllergyIds={selectedAllergyIds}
        onAllergyChange={setSelectedAllergyIds}
        onContinue={() => setSubStep(3)}
        onBack={() => setSubStep(1)}
      />
    );
  }

  // ── SubStep 3: Estilo de dieta → POST ──
  return (
    <NutritionDietStyleStep
      dietaryPreferences={dietaryPreferences}
      selectedDietIds={selectedDietIds}
      onDietChange={setSelectedDietIds}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onBack={() => setSubStep(2)}
    />
  );
}

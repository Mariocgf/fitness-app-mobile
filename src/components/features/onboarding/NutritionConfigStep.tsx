import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

import BackButton from '@/src/components/common/BackButton';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import SelectableCard from '@/src/components/common/SelectableCard';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import TagSelect from '@/src/components/common/TagSelect';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import {
  getFoodAllergies,
  getDietaryPreferences,
  getSubGoals,
  submitNutritionProfile,
} from '@/src/services/nutrition.service';
import { NutritionItem, SubGoal } from '@/src/types/nutrition';

interface NutritionConfigStepProps {
  brandColor: string;
  moduleId: string;
  globalGoalName: string;
  onComplete: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
}

export default function NutritionConfigStep({
  brandColor,
  moduleId,
  globalGoalName,
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
        <Text className="text-slate-500 dark:text-zinc-400 mt-4">
          Cargando datos de nutrición...
        </Text>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 1: Sub-objetivos
  // ═══════════════════════════════════════════════════════════════════
  if (subStep === 0) {
    return (
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <OnboardingHeader
            title="Plan de nutrición"
            subtitle="Define tus metas alimenticias para personalizar tus recetas"
          />

          <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200">
            Tu objetivo
          </Text>
          <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
            ¿Qué quieres lograr?
          </Text>

          <View style={{ gap: 12 }}>
            {subGoals.map((goal) => (
              <SelectableCard
                key={goal.id}
                isSelected={selectedSubGoalIds.includes(goal.id)}
                brandColor={brandColor}
                label={goal.name}
                description={goal.description}
                onPress={() => toggleSubGoal(goal.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Footer fijo con texto del objetivo global */}
        <OnboardingFooter
          brandColor={brandColor}
          onPress={() => setSubStep(1)}
          helperText={`Estos sub-objetivos están adaptados a tu meta principal: ${globalGoalName}\nPuedes editar estos datos luego.`}
        />
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 2: Alergias + Estilo de dieta → POST
  // ═══════════════════════════════════════════════════════════════════
  return (
    <SwipeBackWrapper onSwipeBack={() => setSubStep(0)}>
    <View className="flex-1">
      <BackButton onPress={() => setSubStep(0)} color={brandColor} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={{ flex: 1, paddingTop: 16 }}
          onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
        >
          <OnboardingHeader
            title="Plan de nutrición"
            subtitle="Define tus metas alimenticias para personalizar tus recetas"
          />

          {/* Alergias — zIndex alto para que el dropdown flote sobre el segundo select */}
          <View style={{ zIndex: 10 }}>
            <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200">
              ¿Tienes alguna alergia?
            </Text>
            <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
              Selecciona las que apliquen
            </Text>
            <TagSelect
              items={allergies}
              selectedIds={selectedAllergyIds}
              onSelectionChange={setSelectedAllergyIds}
              placeholder="Seleccionar - Opcional"
            />
          </View>

          {/* Estilo de dieta */}
          <View style={{ zIndex: 1, marginTop: 24 }}>
            <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200">
              Selecciona tu estilo de dieta
            </Text>
            <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
              Selecciona las que apliquen
            </Text>
            <TagSelect
              items={dietaryPreferences}
              selectedIds={selectedDietIds}
              onSelectionChange={setSelectedDietIds}
              placeholder="Seleccionar - Opcional"
            />
          </View>
        </Pressable>
      </ScrollView>

      <OnboardingFooter
        brandColor={brandColor}
        onPress={handleSubmit}
        disabled={isSubmitting}
        helperText="Puedes editar estos datos luego."
      />
    </View>
    </SwipeBackWrapper>
  );
}

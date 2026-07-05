import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import SelectableCard from '@/src/components/common/SelectableCard';
import { translateGlobalGoal } from '@/src/i18n';
import { Goal } from '@/src/types/goal';

/** Total de pasos del onboarding básico */
const TOTAL_ONBOARDING_STEPS = 3;

interface BasicInfoStep3Props {
  goal: string;
  onGoalChange: (goal: string) => void;
  onContinue: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  goals: Goal[];
  isLoading: boolean;
}

/**
 * Paso 3 del onboarding: Selección de objetivo.
 * Dark-only zinc neutro (onboarding no es módulo → "resto de la UI" en colors.md,
 * mismo criterio que los pasos 1/2). Los objetivos se presentan como lista de
 * items (estilo de la maqueta) vía SelectableCard variant="outline". El back se
 * resuelve por swipe (SwipeBackWrapper en onboarding.tsx).
 */
export default function BasicInfoStep3({
  goal,
  onGoalChange,
  onContinue,
  isSubmitting,
  goals,
  isLoading,
}: BasicInfoStep3Props) {
  const handleContinue = () => {
    if (!goal) {
      alert('Por favor selecciona tu objetivo.');
      return;
    }
    onContinue();
  };

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Indicador de progreso original (no los círculos numerados de la maqueta) */}
      <ProgressBar currentStep={2} totalSteps={TOTAL_ONBOARDING_STEPS} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-6">
          <OnboardingHeader
            title="Tu objetivo"
            subtitle="Esto nos ayuda a generar rutinas y planes adaptados a vos."
            centered
          />

          <Text className="text-base text-zinc-400 mb-3">¿Qué quieres lograr?</Text>

          {isLoading ? (
            <View className="py-10 items-center justify-center">
              <Text className="text-zinc-400">Cargando objetivos...</Text>
            </View>
          ) : (
            <View>
              {goals.map((option) => (
                <SelectableCard
                  key={option.id}
                  isSelected={goal === option.id}
                  label={translateGlobalGoal(option.name)}
                  onPress={() => onGoalChange(option.id)}
                  variant="outline"
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <OnboardingFooter
        onPress={handleContinue}
        disabled={isSubmitting}
        buttonLabel="Continuar"
        helperText="Podrás modificar esto más adelante."
        helperIcon={
          <View className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center">
            <Ionicons name="information-circle-outline" size={20} color="#a1a1aa" />
          </View>
        }
      />
    </View>
  );
}

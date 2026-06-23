import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ScrollView, View } from 'react-native';

import CheckableCard from '@/src/components/common/CheckableCard';
import FieldSection from '@/src/components/common/FieldSection';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import {
  ActivityLevel,
  NUTRITION_ACTIVITY_LEVEL_OPTIONS,
} from '@/src/types/nutrition';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface NutritionActivityLevelStepProps {
  /** Nivel de actividad seleccionado */
  activityLevel: ActivityLevel | null;
  /** Callback al seleccionar nivel de actividad */
  onSelectActivityLevel: (level: ActivityLevel) => void;
  /** Callback al presionar Continuar */
  onContinue: () => void;
  /** Callback al presionar Atrás */
  onBack: () => void;
}

/**
 * Pantalla de nivel de actividad para calcular objetivos nutricionales.
 */
export default function NutritionActivityLevelStep({
  activityLevel,
  onSelectActivityLevel,
  onContinue,
  onBack,
}: NutritionActivityLevelStepProps) {
  return (
    <SwipeBackWrapper onSwipeBack={onBack}>
      <View className="flex-1 bg-zinc-950">
        <ProgressBar currentStep={1} totalSteps={4} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingHeader
            title={"Perfil\nde nutrición"}
            subtitle="Tu gasto diario ayuda al backend a calcular objetivos más precisos."
            centered
          />

          <FieldSection eyebrow="Nivel de actividad" question="¿Cómo se ve tu movimiento semanal?">
            <View className="gap-3">
              {NUTRITION_ACTIVITY_LEVEL_OPTIONS.map((option) => (
                <CheckableCard
                  key={option.value}
                  isSelected={activityLevel === option.value}
                  label={option.label}
                  description={option.description}
                  onPress={() => onSelectActivityLevel(option.value)}
                  variant="radio"
                  accent="amber"
                />
              ))}
            </View>
          </FieldSection>
        </ScrollView>

        <OnboardingFooter
          onPress={onContinue}
          helperText="El front solo envía tu nivel de actividad; los cálculos nutricionales los hace el backend."
          helperIcon={<Ionicons name="calculator-outline" size={18} className="text-zinc-400" />}
        />
      </View>
    </SwipeBackWrapper>
  );
}

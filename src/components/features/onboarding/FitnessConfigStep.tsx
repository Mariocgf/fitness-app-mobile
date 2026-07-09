import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import CheckableCard from '@/src/components/common/CheckableCard';
import FieldSection from '@/src/components/common/FieldSection';
import { translateSubGoalDescription, translateSubGoalName } from '@/src/i18n';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { useFitnessConfigStep } from '@/src/hooks/useFitnessConfigStep';
import {
    EXPERIENCE_LEVEL_OPTIONS,
    TRAINING_HISTORY_OPTIONS,
} from '@/src/types/fitness';

interface FitnessConfigStepProps {
  /** Color de marca del módulo Fitness (para el botón Continuar) */
  brandColor: string;
  /** ID del módulo actual (para obtener los sub-objetivos) */
  moduleId: string;
  /** Nombre de la meta global elegida */
  globalGoalName: string;
  /** Callback al finalizar toda la configuración de Fitness */
  onComplete: () => void;
  /** Indica si se está enviando al backend */
  isSubmitting: boolean;
  /** Setter para controlar el estado de envío desde el padre */
  setIsSubmitting: (v: boolean) => void;
}

/**
 * Configuración del módulo Fitness durante el onboarding.
 * Se compone de 2 pantallas internas (la lógica vive en `useFitnessConfigStep`):
 *   - SubStep 0: Nivel de experiencia + Nivel de actividad
 *   - SubStep 1: Sub-objetivos → envía POST
 *
 * Los días, la duración de sesión y el equipamiento ya no se piden acá: se
 * configuran en el modal de generación de rutina.
 */
export default function FitnessConfigStep({
  brandColor,
  moduleId,
  globalGoalName,
  onComplete,
  isSubmitting,
  setIsSubmitting,
}: FitnessConfigStepProps) {
  const {
    subStep,
    setSubStep,
    experienceLevel,
    setExperienceLevel,
    trainingHistory,
    setTrainingHistory,
    handleContinueStep0,
    subGoals,
    selectedSubGoalIds,
    isLoadingSubGoals,
    toggleSubGoal,
    handleSubmit,
  } = useFitnessConfigStep({ moduleId, onComplete, setIsSubmitting });

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 1: Experiencia + Actividad
  // ═══════════════════════════════════════════════════════════════════
  if (subStep === 0) {
    return (
      <View className="flex-1 bg-zinc-950">
        <ProgressBar currentStep={subStep} totalSteps={2} />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingHeader
            title={"Perfil de\nentrenamiento"}
            subtitle="Conocer tu experiencia nos ayudará a ajustar la intensidad de tus entrenamientos."
            centered
          />

          {/* Nivel de experiencia → selector segmentado sólido */}
          <FieldSection
            eyebrow="Nivel de experiencia"
            question="¿Cuál es tu punto de partida?"
          >
            <SegmentedControl
              options={EXPERIENCE_LEVEL_OPTIONS}
              value={experienceLevel}
              onChange={setExperienceLevel}
              accent="lime"
              variant="solid"
            />
          </FieldSection>

          {/* Divisor entre secciones */}
          <View className="h-px bg-zinc-800 my-8" />

          {/* Nivel de actividad (trainingHistory) → lista de selección única */}
          <FieldSection
            eyebrow="Nivel de actividad"
            question="¿Hace cuánto entrenas?"
          >
            <View className="gap-3">
              {TRAINING_HISTORY_OPTIONS.map((option) => (
                <CheckableCard
                  key={option.value}
                  isSelected={trainingHistory === option.value}
                  label={option.label}
                  onPress={() => setTrainingHistory(option.value)}
                  variant="radio"
                  accent="lime"
                />
              ))}
            </View>
          </FieldSection>
        </ScrollView>

        <OnboardingFooter
          onPress={handleContinueStep0}
          helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
          helperIcon={<Ionicons name="sparkles-outline" size={18} className="text-zinc-400" />}
        />
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 2: Sub-objetivos
  // ═══════════════════════════════════════════════════════════════════
  if (subStep === 1) {
    return (
      <SwipeBackWrapper onSwipeBack={() => setSubStep(0)}>
        <View className="flex-1 bg-zinc-950">
          <ProgressBar currentStep={subStep} totalSteps={2} />

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <OnboardingHeader
              title={"Perfil de\nentrenamiento"}
              subtitle="Define tu enfoque principal para personalizar tus rutinas y progresión."
              centered
            />

            <FieldSection eyebrow="Sub objetivo" question="¿Qué quieres lograr?">
              {isLoadingSubGoals ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="large" color={brandColor} />
                  <Text className="text-zinc-400 mt-4">
                    Cargando objetivos...
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {subGoals.map((goal) => (
                    <CheckableCard
                      key={goal.id}
                      isSelected={selectedSubGoalIds.includes(goal.id)}
                      label={translateSubGoalName(goal.name)}
                      description={translateSubGoalDescription(goal.description)}
                      onPress={() => toggleSubGoal(goal.id)}
                      variant="radio"
                      accent="lime"
                    />
                  ))}
                </View>
              )}
            </FieldSection>
          </ScrollView>

          <OnboardingFooter
            onPress={handleSubmit}
            disabled={isSubmitting}
            helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
            helperIcon={<Ionicons name="sparkles-outline" size={18} className="text-zinc-400" />}
          />
        </View>
      </SwipeBackWrapper>
    );
  }

  return null;
}

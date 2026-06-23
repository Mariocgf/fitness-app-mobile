import CheckableCard from '@/src/components/common/CheckableCard';
import FieldSection from '@/src/components/common/FieldSection';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import { SubGoal } from '@/src/types/nutrition';
import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ScrollView, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface NutritionSubGoalStepProps {
  /** Lista de sub-objetivos disponibles */
  subGoals: SubGoal[];
  /** ID de sub-objetivo seleccionado */
  selectedSubGoalId: string | null;
  /** Callback al seleccionar un sub-objetivo */
  onSelectSubGoal: (id: string) => void;
  /** Callback al presionar Continuar */
  onContinue: () => void;
}

/**
 * Pantalla 1 de NutritionConfigStep.
 * Permite al usuario elegir sus sub-objetivos de nutrición.
 */
export default function NutritionSubGoalStep({
  subGoals,
  selectedSubGoalId,
  onSelectSubGoal,
  onContinue,
}: NutritionSubGoalStepProps) {
  return (
    <View className="flex-1 bg-zinc-950">
      <ProgressBar currentStep={0} totalSteps={3} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHeader
          title={"Perfil\nde nutrición"}
          subtitle="Define tus metas alimenticias para personalizar tus recetas"
          centered
        />

        <FieldSection eyebrow="Sub objetivo" question="¿Qué quieres lograr?">
          <View className="gap-3">
            {subGoals.map((goal) => (
              <CheckableCard
                key={goal.id}
                isSelected={selectedSubGoalId === goal.id}
                label={goal.name}
                description={goal.description}
                onPress={() => onSelectSubGoal(goal.id)}
                variant="radio"
                accent="amber"
              />
            ))}
          </View>
        </FieldSection>
      </ScrollView>

      <OnboardingFooter
        onPress={onContinue}
        helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
        helperIcon={<Ionicons name="sparkles-outline" size={18} className="text-zinc-400" />}
      />
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, View } from 'react-native';

import CheckableCard from '@/src/components/common/CheckableCard';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import SectionCard from '@/src/components/common/SectionCard';
import { SubGoal } from '@/src/types/nutrition';

interface NutritionSubGoalStepProps {
  /** Lista de sub-objetivos disponibles */
  subGoals: SubGoal[];
  /** IDs de sub-objetivos seleccionados */
  selectedSubGoalIds: string[];
  /** Callback al marcar/desmarcar un sub-objetivo */
  onToggleSubGoal: (id: string) => void;
  /** Callback al presionar Continuar */
  onContinue: () => void;
}

/**
 * Pantalla 1 de NutritionConfigStep.
 * Permite al usuario elegir sus sub-objetivos de nutrición.
 */
export default function NutritionSubGoalStep({
  subGoals,
  selectedSubGoalIds,
  onToggleSubGoal,
  onContinue,
}: NutritionSubGoalStepProps) {
  return (
    <View className="flex-1">
      <ProgressBar currentStep={0} totalSteps={3} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHeader
          title={"Perfil\nde nutrición"}
          subtitle="Define tus metas alimenticias para personalizar tus recetas"
        />

        <SectionCard
          icon={<Ionicons name="flag-outline" size={20} color="#64748b" />}
          title="Sub objetivo"
          subtitle="¿Qué quieres lograr?"
        >
          <View style={{ gap: 12 }}>
            {subGoals.map((goal) => (
              <CheckableCard
                key={goal.id}
                isSelected={selectedSubGoalIds.includes(goal.id)}
                label={goal.name}
                description={goal.description}
                onPress={() => onToggleSubGoal(goal.id)}
              />
            ))}
          </View>
        </SectionCard>
      </ScrollView>

      <OnboardingFooter
        onPress={onContinue}
        helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
        helperIcon={<Ionicons name="sparkles-outline" size={18} color="#64748b" />}
      />
    </View>
  );
}

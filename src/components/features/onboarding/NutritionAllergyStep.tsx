import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import SearchableSelect from '@/src/components/common/SearchableSelect';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { NutritionItem } from '@/src/types/nutrition';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { DeviceEventEmitter, Pressable, ScrollView, View } from 'react-native';

/** Acento del módulo Nutrición (colors.md → amber-400). */
const NUTRITION_ACCENT = '#fbbf24';

interface NutritionAllergyStepProps {
  /** Lista de alergias disponibles */
  allergies: NutritionItem[];
  /** IDs de alergias seleccionadas */
  selectedAllergyIds: string[];
  /** Callback al cambiar alergias */
  onAllergyChange: (ids: string[]) => void;
  /** Callback al presionar Continuar */
  onContinue: () => void;
  /** Callback al presionar Atrás */
  onBack: () => void;
}

/**
 * Pantalla 3 de NutritionConfigStep: selección de alergias alimentarias.
 * Misma vista que el onboarding de Salud (buscar + seleccionar de un catálogo),
 * así que reutiliza el átomo SearchableSelect. Las alergias no traen severidad,
 * por lo que el dot del átomo cae a gris neutro.
 */
export default function NutritionAllergyStep({
  allergies,
  selectedAllergyIds,
  onAllergyChange,
  onContinue,
  onBack,
}: NutritionAllergyStepProps) {
  const helperFooter = (
    <View className="w-11 h-11 rounded-2xl bg-zinc-900 items-center justify-center border border-zinc-800">
      <Ionicons name="lock-closed-outline" size={20} color={NUTRITION_ACCENT} />
    </View>
  );

  return (
    <SwipeBackWrapper onSwipeBack={onBack}>
      <View className="flex-1">
        <ProgressBar currentStep={2} totalSteps={4} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
          >
            <OnboardingHeader
              title="Datos de nutrición"
              subtitle="Cuéntanos tus alergias alimentarias que debamos considerar."
              centered
            />

            <SearchableSelect
              items={allergies}
              selectedIds={selectedAllergyIds}
              onSelectionChange={onAllergyChange}
              placeholder="Buscar alergia"
              cardTitle="¿Tienes alguna alergia?"
            />
          </Pressable>
        </ScrollView>

        <OnboardingFooter
          onPress={onContinue}
          buttonLabel="Continuar"
          helperText="Esta información es confidencial y solo se usa para personalizar tu planes."
          helperIcon={helperFooter}
        />
      </View>
    </SwipeBackWrapper>
  );
}

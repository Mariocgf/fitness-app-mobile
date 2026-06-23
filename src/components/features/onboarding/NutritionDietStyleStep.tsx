import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import SearchableSelect from '@/src/components/common/SearchableSelect';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { NutritionItem } from '@/src/types/nutrition';
import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { DeviceEventEmitter, Pressable, ScrollView, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

/** Acento del módulo Nutrición (colors.md → amber-400). */
const NUTRITION_ACCENT = '#fbbf24';

interface NutritionDietStyleStepProps {
  /** Lista de estilos de dieta disponibles */
  dietaryPreferences: NutritionItem[];
  /** IDs de estilos seleccionados */
  selectedDietIds: string[];
  /** Callback al cambiar estilos de dieta */
  onDietChange: (ids: string[]) => void;
  /** Callback al enviar el formulario */
  onSubmit: () => void;
  /** Indica si el envío está en curso */
  isSubmitting: boolean;
  /** Callback al presionar Atrás */
  onBack: () => void;
}

/**
 * Pantalla 4 de NutritionConfigStep: estilo de dieta → dispara el POST.
 * Misma vista que el onboarding de Salud (buscar + seleccionar de un catálogo),
 * así que reutiliza el átomo SearchableSelect. Los estilos de dieta no traen
 * severidad, por lo que el dot del átomo cae a gris neutro.
 */
export default function NutritionDietStyleStep({
  dietaryPreferences,
  selectedDietIds,
  onDietChange,
  onSubmit,
  isSubmitting,
  onBack,
}: NutritionDietStyleStepProps) {
  const helperFooter = (
    <View className="w-11 h-11 rounded-2xl bg-zinc-900 items-center justify-center border border-zinc-800">
      <Ionicons name="lock-closed-outline" size={20} color={NUTRITION_ACCENT} />
    </View>
  );

  return (
    <SwipeBackWrapper onSwipeBack={onBack}>
      <View className="flex-1">
        <ProgressBar currentStep={3} totalSteps={4} />

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
              subtitle="Cuéntanos qué estilo de alimentación prefieres."
              centered
            />

            <SearchableSelect
              items={dietaryPreferences}
              selectedIds={selectedDietIds}
              onSelectionChange={onDietChange}
              placeholder="Buscar estilo de dieta"
              cardTitle="¿Sigues algún estilo de dieta?"
            />
          </Pressable>
        </ScrollView>

        <OnboardingFooter
          onPress={onSubmit}
          disabled={isSubmitting}
          buttonLabel="Continuar"
          helperText="Esta información es confidencial y solo se usa para personalizar tu planes."
          helperIcon={helperFooter}
        />
      </View>
    </SwipeBackWrapper>
  );
}

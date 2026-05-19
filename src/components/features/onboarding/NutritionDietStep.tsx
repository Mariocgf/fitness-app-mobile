// Reemplazado por NutritionAllergyStep.tsx y NutritionDietStyleStep.tsx
// Este archivo puede eliminarse de forma segura.
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { DeviceEventEmitter, Pressable, ScrollView, View } from 'react-native';

import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import SectionCard from '@/src/components/common/SectionCard';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import TagSelect from '@/src/components/common/TagSelect';
import { NutritionItem } from '@/src/types/nutrition';

interface NutritionDietStepProps {
  /** Lista de alergias disponibles */
  allergies: NutritionItem[];
  /** IDs de alergias seleccionadas */
  selectedAllergyIds: string[];
  /** Callback al cambiar alergias */
  onAllergyChange: (ids: string[]) => void;
  /** Lista de preferencias dietarias disponibles */
  dietaryPreferences: NutritionItem[];
  /** IDs de preferencias seleccionadas */
  selectedDietIds: string[];
  /** Callback al cambiar preferencias dietarias */
  onDietChange: (ids: string[]) => void;
  /** Callback al enviar el formulario */
  onSubmit: () => void;
  /** Indica si el envío está en curso */
  isSubmitting: boolean;
  /** Callback al presionar Atrás */
  onBack: () => void;
}

/**
 * Pantalla 2 de NutritionConfigStep.
 * Permite al usuario seleccionar alergias y estilo de dieta.
 */
export default function NutritionDietStep({
  allergies,
  selectedAllergyIds,
  onAllergyChange,
  dietaryPreferences,
  selectedDietIds,
  onDietChange,
  onSubmit,
  isSubmitting,
  onBack,
}: NutritionDietStepProps) {
  return (
    <SwipeBackWrapper onSwipeBack={onBack}>
      <View className="flex-1">
        <ProgressBar currentStep={1} totalSteps={3} />

        <Pressable
          style={{ flex: 1 }}
          onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <OnboardingHeader
              title={"Perfil\nde nutrición"}
              subtitle="Define tus metas alimenticias para personalizar tus recetas"
            />

            {/* Card: Alergias — zIndex alto para que el dropdown flote sobre el siguiente */}
            <View style={{ zIndex: 10 }}>
              <SectionCard
                icon={<Ionicons name="warning-outline" size={20} color="#64748b" />}
                title="Alergias"
                subtitle="¿Tenés alguna alergia?"
                className="mb-4"
              >
                <TagSelect
                  items={allergies}
                  selectedIds={selectedAllergyIds}
                  onSelectionChange={onAllergyChange}
                  placeholder="Seleccionar - Opcional"
                />
              </SectionCard>
            </View>

            {/* Card: Estilo de dieta */}
            <View style={{ zIndex: 1 }}>
              <SectionCard
                icon={<Ionicons name="leaf-outline" size={20} color="#64748b" />}
                title="Estilo de dieta"
                subtitle="¿Seguís algún estilo de alimentación?"
              >
                <TagSelect
                  items={dietaryPreferences}
                  selectedIds={selectedDietIds}
                  onSelectionChange={onDietChange}
                  placeholder="Seleccionar - Opcional"
                />
              </SectionCard>
            </View>
          </ScrollView>
        </Pressable>

        <OnboardingFooter
          onPress={onSubmit}
          disabled={isSubmitting}
          helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
          helperIcon={<Ionicons name="sparkles-outline" size={18} color="#64748b" />}
        />
      </View>
    </SwipeBackWrapper>
  );
}

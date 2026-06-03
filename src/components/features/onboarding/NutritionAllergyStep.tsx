import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import SectionCard from '@/src/components/common/SectionCard';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import TagSelect from '@/src/components/common/TagSelect';
import { NutritionItem } from '@/src/types/nutrition';
import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { DeviceEventEmitter, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

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
 * Pantalla 2 de NutritionConfigStep.
 * Permite seleccionar alergias alimentarias.
 */
export default function NutritionAllergyStep({
  allergies,
  selectedAllergyIds,
  onAllergyChange,
  onContinue,
  onBack,
}: NutritionAllergyStepProps) {
  const selectedItems = allergies.filter((a) => selectedAllergyIds.includes(a.id));

  const handleRemove = (id: string) => {
    onAllergyChange(selectedAllergyIds.filter((sid) => sid !== id));
  };

  return (
    <SwipeBackWrapper onSwipeBack={onBack}>
      <View className="flex-1">
        <ProgressBar currentStep={2} totalSteps={4} />

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

            {/* Card: Buscador de alergias */}
            <SectionCard
              icon={<Ionicons name="ban-outline" size={20} className="text-slate-500" />}
              title="Tienes alguna alergia?"
              subtitle="Selecciona todas las que apliquen"
              className="mb-4"
            >
              <TagSelect
                items={allergies}
                selectedIds={selectedAllergyIds}
                onSelectionChange={onAllergyChange}
                placeholder="Buscar alergia"
                showSelectedList={false}
              />
            </SectionCard>

            {/* Lista de alergias seleccionadas */}
            {selectedItems.length > 0 && (
              <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Seleccionadas ({selectedItems.length})
                  </Text>
                  <TouchableOpacity onPress={() => onAllergyChange([])}>
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      Borrar todas
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedItems.map((item, index) => (
                  <View
                    key={item.id}
                    className={`flex-row items-center px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 ${
                      index < selectedItems.length - 1 ? 'mb-2' : ''
                    }`}
                  >
                    <Text className="flex-1 text-base text-slate-900 dark:text-slate-50">
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemove(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={18} className="text-slate-400" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </Pressable>

        <OnboardingFooter
          onPress={onContinue}
          helperText="Esta informacion es confidencial y solo se usa para personalizar tu planes."
          helperIcon={<Ionicons name="lock-closed-outline" size={18} className="text-slate-500" />}
        />
      </View>
    </SwipeBackWrapper>
  );
}

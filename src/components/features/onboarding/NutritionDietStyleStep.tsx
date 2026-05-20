import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { DeviceEventEmitter, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import SectionCard from '@/src/components/common/SectionCard';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import TagSelect from '@/src/components/common/TagSelect';
import { NutritionItem } from '@/src/types/nutrition';

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
 * Pantalla 3 de NutritionConfigStep.
 * Permite seleccionar el estilo de dieta → dispara el POST.
 */
export default function NutritionDietStyleStep({
  dietaryPreferences,
  selectedDietIds,
  onDietChange,
  onSubmit,
  isSubmitting,
  onBack,
}: NutritionDietStyleStepProps) {
  const selectedItems = dietaryPreferences.filter((d) => selectedDietIds.includes(d.id));

  const handleRemove = (id: string) => {
    onDietChange(selectedDietIds.filter((sid) => sid !== id));
  };

  return (
    <SwipeBackWrapper onSwipeBack={onBack}>
      <View className="flex-1">
        <ProgressBar currentStep={2} totalSteps={3} />

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

            {/* Card: Buscador de estilos de dieta */}
            <SectionCard
              icon={<Ionicons name="restaurant-outline" size={20} className="text-slate-500" />}
              title="Estilo de dieta"
              subtitle="Selecciona todas las que apliquen"
              className="mb-4"
            >
              <TagSelect
                items={dietaryPreferences}
                selectedIds={selectedDietIds}
                onSelectionChange={onDietChange}
                placeholder="Buscar tipos de dietas"
                showSelectedList={false}
              />
            </SectionCard>

            {/* Lista de estilos seleccionados */}
            {selectedItems.length > 0 && (
              <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Seleccionadas ({selectedItems.length})
                  </Text>
                  <TouchableOpacity onPress={() => onDietChange([])}>
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
          onPress={onSubmit}
          disabled={isSubmitting}
          helperText="Esta informacion es confidencial y solo se usa para personalizar tu planes."
          helperIcon={<Ionicons name="lock-closed-outline" size={18} className="text-slate-500" />}
        />
      </View>
    </SwipeBackWrapper>
  );
}

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import {
  ConsumedFoodItemDto,
  FoodCatalogItemDto,
  MealType,
} from '@/src/types/nutrition';
import { MEAL_LABELS, MEAL_ORDER } from '@/src/utils/nutrition.utils';

import { ConsumedFoodCard } from './ConsumedFoodCard';
import { FoodSearchSheet } from './FoodSearchSheet';

/** Opciones del selector de comida (orden fijo del backend). */
const MEAL_OPTIONS = MEAL_ORDER.map((mealType) => ({
  label: MEAL_LABELS[mealType],
  value: mealType,
}));

interface FoodRegisterViewProps {
  selectedMealType: MealType;
  selectedMealCalories: number;
  selectedMealItems: ConsumedFoodItemDto[];
  isLoading: boolean;
  error: string | null;
  addError: string | null;
  isAdding: boolean;
  isSaving: boolean;
  canSave: boolean;
  onBack: () => void;
  onMealChange: (mealType: MealType) => void;
  onRefresh: () => void;
  onAddFood: (food: FoodCatalogItemDto, gramsConsumed: number) => Promise<boolean>;
  onFoodGramsChange: (itemId: string, gramsConsumed: number) => void;
  onSave: () => void;
}

/**
 * Vista de registro de alimentos para una comida (dark `zinc`/`amber`).
 * Rediseñada desde la maqueta: header con kcal total, selector de comida,
 * cards de alimento y CTA "Guardar comida" propio (ya no vive en el FAB).
 */
export function FoodRegisterView({
  selectedMealType,
  selectedMealCalories,
  selectedMealItems,
  isLoading,
  error,
  addError,
  isAdding,
  isSaving,
  canSave,
  onBack,
  onMealChange,
  onRefresh,
  onAddFood,
  onFoodGramsChange,
  onSave,
}: FoodRegisterViewProps) {
  const insets = useSafeAreaInsets();
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  /** El CTA flota sobre el tab bar nativo; el scroll debe dejarle ese hueco. */
  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT + 8;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text className="text-zinc-400 mt-4">Cargando alimentos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white text-xl font-bold">
          No pudimos cargar la comida
        </Text>
        <Text className="text-zinc-400 text-center mt-2">{error}</Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="bg-amber-400 rounded-full px-6 py-3 mt-5"
        >
          <Text className="text-zinc-900 font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onBack}
            className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">
            Registrar alimentos
          </Text>
          <View className="w-11" />
        </View>

        <View className="flex-row items-baseline justify-center mt-3">
          <Text className="text-white text-4xl font-bold">
            {Math.round(selectedMealCalories)}
          </Text>
          <Text className="text-zinc-400 text-base font-medium ml-1">kcal</Text>
        </View>

        <View className="mt-5">
          <SegmentedControl
            options={MEAL_OPTIONS}
            value={selectedMealType}
            onChange={onMealChange}
            accent="amber"
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pt-5 gap-4"
        contentContainerStyle={{ paddingBottom: bottomOffset + 76 }}
      >
        {selectedMealItems.map((item) => (
          <ConsumedFoodCard
            key={item.id}
            item={item}
            onGramsChange={(grams) => onFoodGramsChange(item.id, grams)}
          />
        ))}

        <TouchableOpacity
          onPress={() => setIsSearchVisible(true)}
          className="bg-zinc-900 border border-dashed border-amber-400/50 rounded-2xl py-6 items-center"
        >
          <Ionicons name="add-circle-outline" size={30} color="#fbbf24" />
          <Text className="text-amber-400 text-base font-semibold mt-2">
            Agregar alimento
          </Text>
        </TouchableOpacity>

        {addError && (
          <Text className="text-rose-400 text-center">{addError}</Text>
        )}
      </ScrollView>

      <View
        className="absolute w-full px-4"
        style={{ bottom: bottomOffset }}
      >
        <TouchableOpacity
          onPress={onSave}
          disabled={!canSave}
          activeOpacity={0.85}
          style={{ opacity: canSave ? 1 : 0.5 }}
          className="w-full bg-amber-400 rounded-full py-4 flex-row items-center justify-center"
        >
          {isSaving ? (
            <ActivityIndicator color="#18181b" />
          ) : (
            <>
              <Ionicons name="restaurant" size={20} color="#18181b" />
              <Text className="text-zinc-900 text-base font-bold ml-2">
                Guardar comida
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {isSearchVisible && (
        <FoodSearchSheet
          visible={isSearchVisible}
          isAdding={isAdding}
          onClose={() => setIsSearchVisible(false)}
          onAdd={onAddFood}
        />
      )}
    </View>
  );
}

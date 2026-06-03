import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ConsumedFoodItemDto,
  FoodCatalogItemDto,
  MealType,
} from '@/src/types/nutrition';
import {
  formatKcal,
  MEAL_LABELS,
  MEAL_ORDER,
} from '@/src/utils/nutrition.utils';

import { ConsumedFoodCard } from './ConsumedFoodCard';
import { FoodSearchSheet } from './FoodSearchSheet';

interface FoodRegisterViewProps {
  selectedMealType: MealType;
  selectedMealCalories: number;
  selectedMealItems: ConsumedFoodItemDto[];
  isLoading: boolean;
  error: string | null;
  addError: string | null;
  isAdding: boolean;
  onBack: () => void;
  onMealChange: (mealType: MealType) => void;
  onRefresh: () => void;
  onAddFood: (food: FoodCatalogItemDto, gramsConsumed: number) => Promise<boolean>;
  onFoodGramsChange: (itemId: string, gramsConsumed: number) => void;
}

/**
 * Vista de registro de alimentos para una comida.
 */
export function FoodRegisterView({
  selectedMealType,
  selectedMealCalories,
  selectedMealItems,
  isLoading,
  error,
  addError,
  isAdding,
  onBack,
  onMealChange,
  onRefresh,
  onAddFood,
  onFoodGramsChange,
}: FoodRegisterViewProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [editingGramsItemId, setEditingGramsItemId] = useState<string | null>(null);

  const closeGramsPicker = () => {
    setEditingGramsItemId(null);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text className="text-slate-500 dark:text-slate-400 mt-4">
          Cargando alimentos...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold">
          No pudimos cargar la comida
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-center mt-2">
          {error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="bg-amber-400 rounded-full px-6 py-3 mt-5"
        >
          <Text className="text-slate-900 font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      onTouchStart={closeGramsPicker}
    >
      <View className="px-4 pt-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onBack}
            className="w-11 h-11 rounded-full bg-slate-700 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color="#ffffff" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-slate-900 dark:text-slate-50 text-xl font-semibold">
              Registrar alimentos
            </Text>
            <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mt-2">
              {formatKcal(selectedMealCalories)}
            </Text>
          </View>
          <View className="w-11" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 py-4"
        >
          {MEAL_ORDER.map((mealType) => {
            const isSelected = selectedMealType === mealType;
            return (
              <TouchableOpacity
                key={mealType}
                onPress={() => {
                  closeGramsPicker();
                  onMealChange(mealType);
                }}
                className={`px-5 py-2 rounded-full border ${
                  isSelected
                    ? 'bg-amber-500 border-amber-500'
                    : 'bg-transparent border-slate-400 dark:border-slate-600'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    isSelected
                      ? 'text-white'
                      : 'text-slate-900 dark:text-slate-50'
                  }`}
                >
                  {MEAL_LABELS[mealType]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-32 gap-3"
      >
        {selectedMealItems.map((item) => (
          <ConsumedFoodCard
            key={item.id}
            item={item}
            isGramsPickerVisible={editingGramsItemId === item.id}
            onOpenGramsPicker={() => setEditingGramsItemId(item.id)}
            onGramsChange={(gramsConsumed) => onFoodGramsChange(item.id, gramsConsumed)}
          />
        ))}

        <TouchableOpacity
          onPress={() => {
            closeGramsPicker();
            setIsSearchVisible(true);
          }}
          className="bg-slate-100 dark:bg-slate-900 rounded-2xl py-5 items-center"
        >
          <Ionicons name="add" size={30} color="#0f172a" />
          <Text className="text-slate-900 dark:text-slate-50 text-base mt-2">
            Agregar alimento
          </Text>
        </TouchableOpacity>

        {addError && (
          <Text className="text-red-500 text-center mt-2">{addError}</Text>
        )}
      </ScrollView>

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

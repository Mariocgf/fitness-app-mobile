import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { MealType, NutritionDayDto } from '@/src/types/nutrition';
import {
  formatKcal,
  getMealCalories,
  MEAL_ICONS,
  MEAL_LABELS,
} from '@/src/utils/nutrition.utils';

interface MealSummaryCardProps {
  day: NutritionDayDto | null;
  mealType: MealType;
  onPress: (mealType: MealType) => void;
}

/**
 * Resumen de una comida del día.
 */
export function MealSummaryCard({ day, mealType, onPress }: MealSummaryCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(mealType)}
      className="bg-white dark:bg-slate-900 rounded-full mx-4 px-5 py-3 flex-row items-center"
    >
      <View className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-4">
        <Ionicons name={MEAL_ICONS[mealType] as any} size={25} color="#0f172a" />
      </View>

      <View className="flex-1">
        <Text className="text-slate-900 dark:text-slate-50 text-xl font-semibold">
          {MEAL_LABELS[mealType]}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="flame-outline" size={20} color="#0f172a" />
          <Text className="text-slate-700 dark:text-slate-300 text-base ml-2">
            {formatKcal(getMealCalories(day, mealType))}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={24} color="#0f172a" />
    </TouchableOpacity>
  );
}

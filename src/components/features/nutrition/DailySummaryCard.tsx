import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { NutritionDayDto, NutritionTargetDto } from '@/src/types/nutrition';
import { getConsumedCalories } from '@/src/utils/nutrition.utils';
import { MacroProgressRow } from './MacroProgressRow';

interface DailySummaryCardProps {
  day: NutritionDayDto;
  target: NutritionTargetDto;
}

/**
 * Card "Hoy": calorías consumidas vs objetivo y progreso de macros en barras.
 * Reemplaza al anterior `CalorieRingCard` (anillo) por el diseño con barras.
 */
export function DailySummaryCard({ day, target }: DailySummaryCardProps) {
  const targetCalories = Math.max(target.calories, 0);
  const consumedCalories = getConsumedCalories(day);

  return (
    <View className="bg-zinc-900 rounded-3xl mx-4 p-6">
      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-white text-xl font-bold">Hoy</Text>
        <Ionicons name="calendar-outline" size={20} color="#fbbf24" />
      </View>

      <View className="flex-row items-end">
        <Text className="text-white text-6xl font-bold leading-tight">
          {consumedCalories}
        </Text>
        <Text className="text-zinc-400 text-2xl font-semibold mb-2 ml-1">kcal</Text>
      </View>
      <Text className="text-zinc-400 text-base mt-1">
        Objetivo {Math.round(targetCalories)} kcal
      </Text>

      <View className="h-px bg-zinc-800 my-5" />

      <View className="gap-5">
        <MacroProgressRow
          icon="fish-outline"
          label="Proteínas"
          value={day.totalProteinGrams}
          target={target.proteinGrams}
        />
        <MacroProgressRow
          icon="leaf-outline"
          label="Carbohidratos"
          value={day.totalCarbsGrams}
          target={target.carbsGrams}
        />
        <MacroProgressRow
          icon="water-outline"
          label="Grasas"
          value={day.totalFatGrams}
          target={target.fatGrams}
        />
      </View>
    </View>
  );
}

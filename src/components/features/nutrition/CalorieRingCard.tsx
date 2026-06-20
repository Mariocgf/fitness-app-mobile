import React from 'react';
import { Text, View } from 'react-native';

import { NutritionDayDto, NutritionTargetDto } from '@/src/types/nutrition';
import { MacroRing } from './MacroRing';

interface MacroPillProps {
  label: string;
  value: number;
  target: number;
  className: string;
}

function MacroPill({ label, value, target, className }: MacroPillProps) {
  return (
    <View className="items-center flex-1">
      <View className={`px-3 py-2 rounded-full mb-2 min-w-[104px] items-center ${className}`}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          className="text-white text-sm font-bold"
        >
          {label}
        </Text>
      </View>
      <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold">
        {Math.round(value)}
      </Text>
      <Text className="text-slate-900 dark:text-slate-300 text-xs">
        /{Math.round(target)} g
      </Text>
    </View>
  );
}

interface CalorieRingCardProps {
  day: NutritionDayDto;
  target: NutritionTargetDto;
}

/**
 * Card principal con progreso visual de calorías y macros.
 */
export function CalorieRingCard({ day, target }: CalorieRingCardProps) {
  const targetCalories = Math.max(target.calories, 0);
  const consumedCalories = Math.max(
    day.totalCalories,
    day.totalProteinGrams * 4 + day.totalCarbsGrams * 4 + day.totalFatGrams * 9,
  );

  return (
    <View className="bg-white dark:bg-slate-900 rounded-[32px] mx-4 p-6">
      <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
        Calorías
      </Text>

      <MacroRing
        proteinGrams={day.totalProteinGrams}
        carbsGrams={day.totalCarbsGrams}
        fatGrams={day.totalFatGrams}
        targetCalories={targetCalories}
        centerTop={String(Math.round(consumedCalories))}
        centerBottom="kcal"
      />

      <View className="flex-row gap-3">
        <MacroPill
          label="Proteína"
          value={day.totalProteinGrams}
          target={target.proteinGrams}
          className="bg-blue-500"
        />
        <MacroPill
          label="Carbohidratos"
          value={day.totalCarbsGrams}
          target={target.carbsGrams}
          className="bg-orange-500"
        />
        <MacroPill
          label="Grasa"
          value={day.totalFatGrams}
          target={target.fatGrams}
          className="bg-emerald-500"
        />
      </View>
    </View>
  );
}

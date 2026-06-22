import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';
import { MealType, NutritionDayDto } from '@/src/types/nutrition';
import {
  formatKcal,
  getMealCalories,
  getMealItems,
  MEAL_ICONS,
  MEAL_LABELS,
} from '@/src/utils/nutrition.utils';

interface MealRowProps {
  day: NutritionDayDto | null;
  mealType: MealType;
  onPress: (mealType: MealType) => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Fila de una comida del día dentro de la card "Comidas de hoy".
 * Una comida se considera registrada si tiene alimentos cargados; en ese caso
 * muestra el check y las kcal, si no muestra "Pendiente".
 */
export function MealRow({ day, mealType, onPress }: MealRowProps) {
  const isLogged = getMealItems(day, mealType).length > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(mealType)}
      className="flex-row items-center gap-4 py-3.5"
    >
      <IconTile
        name={MEAL_ICONS[mealType] as IoniconName}
        color={isLogged ? '#fbbf24' : '#71717a'}
      />

      <View className="flex-1 flex-row items-center gap-2">
        <Text className="text-white text-base font-semibold">
          {MEAL_LABELS[mealType]}
        </Text>
        {isLogged && (
          <View className="w-5 h-5 rounded-full bg-amber-400 items-center justify-center">
            <Ionicons name="checkmark" size={13} color="#18181b" />
          </View>
        )}
      </View>

      {isLogged ? (
        <Text className="text-white text-base font-semibold">
          {formatKcal(getMealCalories(day, mealType))}
        </Text>
      ) : (
        <Text className="text-zinc-500 text-base">Pendiente</Text>
      )}

      <Ionicons name="chevron-forward" size={20} color="#71717a" />
    </TouchableOpacity>
  );
}

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';
import { RoutineMealSummaryDto } from '@/src/types/nutritionRoutine';
import { MEAL_ICONS, MEAL_LABELS } from '@/src/utils/nutrition.utils';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface RoutineMealCardProps {
  meal: RoutineMealSummaryDto;
  onPress: (meal: RoutineMealSummaryDto) => void;
}

/**
 * Card de comida del plan diario (dark zinc/amber).
 * Muestra el tile del tipo de comida, el label, el nombre del plato y su descripción.
 *
 * NO muestra kcal ni macros: el resumen del backend (`RoutineMealSummaryDto`) solo
 * trae `type`, `name` y `description`. Las calorías/macros recién aparecen en el
 * detalle (`GET /meals/{id}`), así que mostrarlas acá implicaría inventarlas o
 * pedir 4 requests por día. Ver `agent-implementation-lessons.md`.
 */
export function RoutineMealCard({ meal, onPress }: RoutineMealCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(meal)}
      activeOpacity={0.75}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mx-4 mb-3 flex-row items-center gap-4"
    >
      <IconTile name={MEAL_ICONS[meal.type] as IoniconName} size={56} iconSize={26} />

      <View className="flex-1 min-w-0">
        <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-0.5">
          {MEAL_LABELS[meal.type]}
        </Text>
        <Text
          className="text-white text-lg font-bold leading-snug"
          numberOfLines={2}
        >
          {meal.name}
        </Text>
        <Text
          className="text-zinc-500 text-sm leading-snug mt-0.5"
          numberOfLines={2}
        >
          {meal.description}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#71717a" />
    </TouchableOpacity>
  );
}

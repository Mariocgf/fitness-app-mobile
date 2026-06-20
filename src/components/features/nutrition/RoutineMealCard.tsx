import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { RoutineMealSummaryDto } from '@/src/types/nutritionRoutine';
import { MEAL_ICONS, MEAL_LABELS } from '@/src/utils/nutrition.utils';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface RoutineMealCardProps {
  meal: RoutineMealSummaryDto;
  onPress: (meal: RoutineMealSummaryDto) => void;
}

/**
 * Item de comida en el plan diario.
 * Muestra tipo (coloreado amber), nombre y descripción. Sin imagen ni macros (no vienen del backend en este paso).
 */
export function RoutineMealCard({ meal, onPress }: RoutineMealCardProps) {
  const label = MEAL_LABELS[meal.type];
  const icon = MEAL_ICONS[meal.type] as any;

  return (
    <TouchableOpacity
      onPress={() => onPress(meal)}
      activeOpacity={0.75}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mx-4 mb-3"
    >
      <View className="flex-row items-start gap-3">
        {/* Ícono del tipo de comida */}
        <View className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 items-center justify-center mt-0.5 flex-shrink-0">
          <Ionicons name={icon} size={20} className="text-amber-500" />
        </View>

        {/* Contenido */}
        <View className="flex-1 min-w-0">
          <Text className="text-amber-500 text-xs font-semibold uppercase tracking-wide mb-0.5">
            {label}
          </Text>
          <Text
            className="text-slate-900 dark:text-slate-50 text-base font-semibold leading-snug mb-1"
            numberOfLines={2}
          >
            {meal.name}
          </Text>
          <Text
            className="text-slate-500 dark:text-slate-400 text-sm leading-snug"
            numberOfLines={2}
          >
            {meal.description}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={18}
          className="text-slate-400 dark:text-slate-500 mt-1 flex-shrink-0"
        />
      </View>
    </TouchableOpacity>
  );
}

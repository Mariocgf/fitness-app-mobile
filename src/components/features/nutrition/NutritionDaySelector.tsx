import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

import { RoutineDayName } from '@/src/types/nutritionRoutine';
import { ROUTINE_DAY_LABELS, ROUTINE_DAY_ORDER } from '@/src/utils/nutritionRoutine.utils';

interface NutritionDaySelectorProps {
  days: RoutineDayName[];
  activeDayName: RoutineDayName;
  onSelectDay: (day: RoutineDayName) => void;
}

/**
 * Selector horizontal de días para el plan nutricional.
 * Chip amber-400 para el día activo, borde slate para el resto.
 */
export function NutritionDaySelector({
  days,
  activeDayName,
  onSelectDay,
}: NutritionDaySelectorProps) {
  const orderedDays = ROUTINE_DAY_ORDER.filter((d) => days.includes(d));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
    >
      {orderedDays.map((day) => {
        const isActive = day === activeDayName;
        return (
          <TouchableOpacity
            key={day}
            onPress={() => onSelectDay(day)}
            activeOpacity={0.75}
            className={`px-4 py-2 rounded-full border ${
              isActive
                ? 'bg-amber-400 border-amber-400'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isActive ? 'text-black' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {ROUTINE_DAY_LABELS[day]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

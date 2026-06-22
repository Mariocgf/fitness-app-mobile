import React from 'react';
import { ScrollView } from 'react-native';

import { SelectablePill } from '@/src/components/common/SelectablePill';
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
      {orderedDays.map((day) => (
        <SelectablePill
          key={day}
          label={ROUTINE_DAY_LABELS[day]}
          selected={day === activeDayName}
          onPress={() => onSelectDay(day)}
          accent="amber"
        />
      ))}
    </ScrollView>
  );
}

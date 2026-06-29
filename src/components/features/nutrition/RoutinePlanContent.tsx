import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

import {
  NutritionRoutineDto,
  RoutineDayName,
  RoutineMealSummaryDto,
} from '@/src/types/nutritionRoutine';
import { MEAL_ORDER } from '@/src/utils/nutrition.utils';
import {
  ROUTINE_DAY_FULL_LABELS,
  ROUTINE_DAY_ORDER,
  getTodayRoutineDayName,
} from '@/src/utils/nutritionRoutine.utils';
import { NutritionDaySelector } from './NutritionDaySelector';
import { RoutineMealCard } from './RoutineMealCard';

/** Skeleton animado reutilizable para los estados de carga del plan. */
export function PlanSkeletonItem({ className }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }} className={`bg-zinc-800 ${className}`} />;
}

/** Esqueleto de carga del plan (selector de días + cards de comidas). */
export function PlanSkeleton() {
  return (
    <View className="flex-1 px-4 pt-4 gap-3">
      <View className="flex-row gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <PlanSkeletonItem key={i} className="w-12 h-8 rounded-full" />
        ))}
      </View>
      {Array.from({ length: 4 }).map((_, i) => (
        <PlanSkeletonItem key={i} className="w-full h-24 rounded-2xl" />
      ))}
    </View>
  );
}

interface RoutinePlanContentProps {
  routine: NutritionRoutineDto;
  onMealPress: (meal: RoutineMealSummaryDto) => void;
}

/**
 * Vista scrolleable del plan (días + comidas).
 * Reutilizada por el tab Plan (Draft/activa) y por el detalle de un plan del listado.
 */
export function RoutinePlanContent({ routine, onMealPress }: RoutinePlanContentProps) {
  const today = getTodayRoutineDayName();
  const [activeDayName, setActiveDayName] = useState<RoutineDayName>(today);

  useEffect(() => {
    const days = routine.days.map((d) => d.day);
    if (days.includes(today)) {
      setActiveDayName(today);
    } else if (days.length > 0) {
      setActiveDayName(days[0]);
    }
  }, [routine, today]);

  const availableDays = ROUTINE_DAY_ORDER.filter((d) => routine.days.some((rd) => rd.day === d));
  const activeDay = routine.days.find((d) => d.day === activeDayName);
  const orderedMeals = activeDay
    ? (MEAL_ORDER.map((type) => activeDay.meals.find((m) => m.type === type)).filter(
        Boolean,
      ) as RoutineMealSummaryDto[])
    : [];

  return (
    <>
      <NutritionDaySelector
        days={availableDays}
        activeDayName={activeDayName}
        onSelectDay={setActiveDayName}
      />
      <View className="px-4 pb-3">
        <Text className="text-white text-2xl font-bold">
          {ROUTINE_DAY_FULL_LABELS[activeDayName]}
        </Text>
        <Text className="text-zinc-400 text-sm mt-0.5">{routine.name}</Text>
      </View>
      {orderedMeals.map((meal) => (
        <RoutineMealCard key={meal.id} meal={meal} onPress={onMealPress} />
      ))}
      <View className="h-6" />
    </>
  );
}

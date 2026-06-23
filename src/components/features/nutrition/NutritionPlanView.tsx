import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNutritionRoutineContext } from '@/src/store/nutrition-routine-context';
import { RoutineDayName, RoutineMealSummaryDto, NutritionRoutineDto } from '@/src/types/nutritionRoutine';
import { MEAL_ORDER } from '@/src/utils/nutrition.utils';
import {
  ROUTINE_DAY_FULL_LABELS,
  ROUTINE_DAY_ORDER,
  getTodayRoutineDayName,
} from '@/src/utils/nutritionRoutine.utils';
import { NutritionDaySelector } from './NutritionDaySelector';
import { RoutineMealCard } from './RoutineMealCard';

/** Skeleton animado para los estados de carga */
function SkeletonItem({ className }: { className?: string }) {
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

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-zinc-800 ${className}`}
    />
  );
}

/** Vista scrolleable del plan (días + comidas) — usada tanto para Draft como para rutina activa */
function RoutinePlanContent({
  routine,
  onMealPress,
}: {
  routine: NutritionRoutineDto;
  onMealPress: (meal: RoutineMealSummaryDto) => void;
}) {
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

  const availableDays = ROUTINE_DAY_ORDER.filter((d) =>
    routine.days.some((rd) => rd.day === d),
  );
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
        <Text className="text-zinc-400 text-sm mt-0.5">
          {routine.name}
        </Text>
      </View>
      {orderedMeals.map((meal) => (
        <RoutineMealCard key={meal.id} meal={meal} onPress={onMealPress} />
      ))}
      <View className="h-6" />
    </>
  );
}

/**
 * Vista "Plan diario" del módulo Nutrición.
 * Maneja tres estados: sin rutina, Draft pendiente de confirmación, y rutina activa.
 */
export function NutritionPlanView() {
  const router = useRouter();
  const {
    routine,
    draft,
    isLoading,
    isGenerating,
    isAccepting,
    isRejecting,
    error,
    generate,
    accept,
    reject,
  } = useNutritionRoutineContext();

  const handleMealPress = useCallback(
    (meal: RoutineMealSummaryDto) => {
      router.push({
        pathname: '/nutrition/meal/[id]' as any,
        params: { id: meal.id },
      });
    },
    [router],
  );

  /** Estado de carga inicial o generando */
  if (isLoading || isGenerating) {
    return (
      <View className="flex-1 px-4 pt-4 gap-3">
        <View className="flex-row gap-2 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonItem key={i} className="w-12 h-8 rounded-full" />
          ))}
        </View>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonItem key={i} className="w-full h-24 rounded-2xl" />
        ))}
      </View>
    );
  }

  /** Estado vacío: sin rutina ni draft */
  if (!routine && !draft) {
    return (
      <View className="flex-1 items-center justify-center px-8 py-16">
        <View className="w-16 h-16 rounded-full bg-amber-900/20 items-center justify-center mb-4">
          <Ionicons name="restaurant-outline" size={32} className="text-amber-400" />
        </View>
        <Text className="text-white text-xl font-bold text-center mb-2">
          Sin plan nutricional
        </Text>
        <Text className="text-zinc-400 text-base text-center mb-6 leading-relaxed">
          Generá tu plan semanal personalizado con IA basado en tu perfil nutricional.
        </Text>
        {error && (
          <Text className="text-rose-500 text-sm text-center mb-4">{error}</Text>
        )}
        <TouchableOpacity
          onPress={generate}
          activeOpacity={0.8}
          className="bg-amber-400 px-8 py-4 rounded-xl"
        >
          <Text className="text-zinc-900 font-bold text-base">Generar plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /** Draft pendiente de confirmación */
  if (draft) {
    const actionDisabled = isAccepting || isRejecting;

    return (
      <View className="flex-1">
        {/* Banner de Draft */}
        <View className="mx-4 mb-2 bg-amber-900/20 border border-amber-700 rounded-xl px-4 py-3 flex-row items-center gap-3">
          <Ionicons name="sparkles-outline" size={20} className="text-amber-400" />
          <Text className="text-amber-300 text-sm font-medium flex-1">
            Plan generado — revisalo antes de activarlo
          </Text>
        </View>

        {error && (
          <Text className="text-rose-500 text-sm text-center mx-4 mb-2">{error}</Text>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          <RoutinePlanContent routine={draft} onMealPress={handleMealPress} />
          {/* Espacio para que el contenido no quede tapado por los botones */}
          <View className="h-36" />
        </ScrollView>

        {/* Barra de acciones fija en el fondo */}
        <View className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 pt-3 pb-6 gap-2">
          {/* Aceptar */}
          <TouchableOpacity
            onPress={accept}
            disabled={actionDisabled}
            activeOpacity={0.8}
            className={`flex-row items-center justify-center py-3.5 rounded-xl gap-2 ${
              actionDisabled ? 'bg-amber-300' : 'bg-amber-400'
            }`}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color="#18181b" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={20} color="#18181b" />
            )}
            <Text className="text-zinc-900 font-bold text-base">
              {isAccepting ? 'Activando...' : 'Aceptar plan'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row gap-2">
            {/* Generar otra */}
            <TouchableOpacity
              onPress={generate}
              disabled={actionDisabled}
              activeOpacity={0.8}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border gap-1.5 ${
                actionDisabled ? 'border-zinc-800' : 'border-zinc-700'
              }`}
            >
              <Ionicons
                name="refresh-outline"
                size={17}
                className={actionDisabled ? 'text-zinc-600' : 'text-zinc-300'}
              />
              <Text
                className={`font-semibold text-sm ${
                  actionDisabled ? 'text-zinc-600' : 'text-zinc-300'
                }`}
              >
                Generar otra
              </Text>
            </TouchableOpacity>

            {/* Descartar */}
            <TouchableOpacity
              onPress={reject}
              disabled={actionDisabled}
              activeOpacity={0.8}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border gap-1.5 ${
                actionDisabled ? 'border-zinc-800' : 'border-rose-900'
              }`}
            >
              {isRejecting ? (
                <ActivityIndicator size="small" color="#f43f5e" />
              ) : (
                <Ionicons
                  name="close-circle-outline"
                  size={17}
                  className={actionDisabled ? 'text-zinc-600' : 'text-rose-500'}
                />
              )}
              <Text
                className={`font-semibold text-sm ${
                  actionDisabled ? 'text-zinc-600' : 'text-rose-500'
                }`}
              >
                {isRejecting ? 'Descartando...' : 'Descartar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  /** Rutina activa confirmada */
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <RoutinePlanContent routine={routine!} onMealPress={handleMealPress} />
    </ScrollView>
  );
}

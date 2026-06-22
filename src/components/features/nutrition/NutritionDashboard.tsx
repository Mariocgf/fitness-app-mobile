import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';
import {
  NutritionDayDto,
  NutritionProfileDto,
  NutritionTargetDto,
  MealType,
} from '@/src/types/nutrition';
import { getConsumedCalories, MEAL_ORDER } from '@/src/utils/nutrition.utils';

import { DailySummaryCard } from './DailySummaryCard';
import { MealRow } from './MealRow';

interface NutritionDashboardProps {
  day: NutritionDayDto | null;
  profile: NutritionProfileDto | null;
  target: NutritionTargetDto | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onMealPress: (mealType: MealType) => void;
  onRegisterPress: () => void;
  onConfigurePress: () => void;
}

/**
 * Vista principal de nutrición (tab "Resumen").
 */
export function NutritionDashboard({
  day,
  profile,
  target,
  isLoading,
  error,
  onRefresh,
  onMealPress,
  onRegisterPress,
  onConfigurePress,
}: NutritionDashboardProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text className="text-zinc-400 mt-4">Cargando nutrición...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={44} color="#fbbf24" />
        <Text className="text-white text-xl font-bold mt-3">Algo falló</Text>
        <Text className="text-zinc-400 text-center mt-2">{error}</Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="bg-amber-400 rounded-full px-6 py-3 mt-5"
        >
          <Text className="text-zinc-900 font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (profile?.selectedSubGoalId == null) {
    return (
      <View className="flex-1 px-4 pt-4">
        <View className="bg-zinc-900 rounded-3xl p-6">
          <Ionicons name="settings-outline" size={36} color="#fbbf24" />
          <Text className="text-white text-2xl font-bold mt-4">
            Configurá tu nutrición
          </Text>
          <Text className="text-zinc-400 mt-2 leading-5">
            Necesitamos completar tus datos antes de mostrar objetivos confiables.
          </Text>
          <TouchableOpacity
            onPress={onConfigurePress}
            className="bg-amber-400 rounded-full py-4 items-center mt-6"
          >
            <Text className="text-zinc-900 font-bold">Configurar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!day || !target) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white text-xl font-bold">No hay datos para hoy</Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="bg-amber-400 rounded-full px-6 py-3 mt-5"
        >
          <Text className="text-zinc-900 font-bold">Actualizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const remainingCalories = Math.round(
    Math.max(target.calories, 0) - getConsumedCalories(day),
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      <View className="pt-4 pb-32">
        <DailySummaryCard day={day} target={target} />

        <Text className="text-zinc-400 text-sm font-semibold mx-5 mt-7 mb-3 uppercase tracking-wide">
          Comidas de hoy
        </Text>

        <View className="bg-zinc-900 rounded-3xl mx-4 px-5">
          {MEAL_ORDER.map((mealType, index) => (
            <View
              key={mealType}
              className={index > 0 ? 'border-t border-zinc-800' : ''}
            >
              <MealRow day={day} mealType={mealType} onPress={onMealPress} />
            </View>
          ))}
        </View>

        {/* Sugerencia de calorías restantes */}
        <View className="bg-zinc-900 rounded-3xl mx-4 mt-4 p-4 flex-row items-center gap-4">
          <IconTile name="bulb-outline" />
          <Text className="flex-1 text-zinc-300 text-base leading-5">
            {remainingCalories > 0 ? (
              <>
                Te quedan <Text className="text-amber-400 font-semibold">{remainingCalories} kcal</Text> para
                alcanzar tu objetivo de hoy.
              </>
            ) : (
              <>
                Alcanzaste tu objetivo de{' '}
                <Text className="text-amber-400 font-semibold">
                  {Math.round(target.calories)} kcal
                </Text>{' '}
                de hoy.
              </>
            )}
          </Text>
        </View>

        {/* CTA principal */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onRegisterPress}
          className="bg-amber-400 rounded-full mx-4 mt-5 py-4 flex-row items-center justify-center gap-2"
        >
          <Ionicons name="restaurant" size={20} color="#18181b" />
          <Text className="text-zinc-900 text-base font-bold">Registrar comida</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

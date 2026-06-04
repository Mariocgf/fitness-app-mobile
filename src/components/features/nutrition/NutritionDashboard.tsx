import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import {
  NutritionDayDto,
  NutritionProfileDto,
  NutritionTargetDto,
  MealType,
} from '@/src/types/nutrition';
import { MEAL_ORDER } from '@/src/utils/nutrition.utils';

import { CalorieRingCard } from './CalorieRingCard';
import { MealSummaryCard } from './MealSummaryCard';

interface NutritionDashboardProps {
  day: NutritionDayDto | null;
  profile: NutritionProfileDto | null;
  target: NutritionTargetDto | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onMealPress: (mealType: MealType) => void;
  onConfigurePress: () => void;
}

/**
 * Vista principal de nutrición.
 */
export function NutritionDashboard({
  day,
  profile,
  target,
  isLoading,
  error,
  onRefresh,
  onMealPress,
  onConfigurePress,
}: NutritionDashboardProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text className="text-slate-500 dark:text-slate-400 mt-4">
          Cargando nutrición...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={44} color="#fbbf24" />
        <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold mt-3">
          Algo falló
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-center mt-2">
          {error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="bg-amber-400 rounded-full px-6 py-3 mt-5"
        >
          <Text className="text-slate-900 font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (profile?.selectedSubGoalId == null) {
    return (
      <View className="flex-1 px-4 pt-8">
        <Text className="text-slate-900 dark:text-slate-50 text-4xl font-bold mb-6">
          Nutrición
        </Text>
        <View className="bg-white dark:bg-slate-900 rounded-[28px] p-6">
          <Ionicons name="settings-outline" size={36} color="#fbbf24" />
          <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mt-4">
            Configurá tu nutrición
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-2 leading-5">
            Necesitamos completar tus datos antes de mostrar objetivos confiables.
          </Text>
          <TouchableOpacity
            onPress={onConfigurePress}
            className="bg-amber-400 rounded-full py-4 items-center mt-6"
          >
            <Text className="text-slate-900 font-bold">Configurar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!day || !target) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold">
          No hay datos para hoy
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="bg-amber-400 rounded-full px-6 py-3 mt-5"
        >
          <Text className="text-slate-900 font-bold">Actualizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="pt-8 pb-32">
      <View className="px-4 mb-5">
        <Text className="text-slate-900 dark:text-slate-50 text-4xl font-bold">
          Nutrición
        </Text>
      </View>

      <CalorieRingCard day={day} target={target} />

      <View className="gap-3 mt-6">
        {MEAL_ORDER.map((mealType) => (
          <MealSummaryCard
            key={mealType}
            day={day}
            mealType={mealType}
            onPress={onMealPress}
          />
        ))}
      </View>
    </View>
  );
}

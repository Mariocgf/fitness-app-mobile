import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { FillBar } from '@/src/components/common/FillBar';
import { IconTile } from '@/src/components/common/IconTile';

/** Acento del módulo Nutrición (colors.md → amber-400). */
const AMBER = '#fbbf24';

interface NutritionTodayCardProps {
  /** Calorías consumidas hoy. */
  consumedCalories: number;
  /** Objetivo de calorías del día (0 si no hay plan/perfil). */
  targetCalories: number;
  /** Abre el módulo de Nutrición para registrar. */
  onPress: () => void;
}

/**
 * Card "Nutrición hoy" del Home (dark-only zinc, acento amber-400). Siempre
 * accesible: muestra kcal consumidas vs objetivo con barra de progreso y un CTA
 * para registrar. Si no hay objetivo (sin perfil nutricional), invita a crearlo.
 */
export function NutritionTodayCard({
  consumedCalories,
  targetCalories,
  onPress,
}: NutritionTodayCardProps) {
  const hasTarget = targetCalories > 0;
  const remaining = Math.max(0, targetCalories - consumedCalories);
  const progress = hasTarget ? consumedCalories / targetCalories : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4"
    >
      <View className="flex-row items-center gap-4">
        <IconTile name="restaurant" color={AMBER} size={56} />
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">Nutrición</Text>
          {hasTarget ? (
            <Text className="text-zinc-400 text-sm mt-0.5">
              <Text className="text-amber-400 font-semibold">
                {consumedCalories}
              </Text>{' '}
              / {targetCalories} kcal
            </Text>
          ) : (
            <Text className="text-zinc-400 text-sm mt-0.5">
              Configurá tu plan nutricional.
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#71717a" />
      </View>

      {hasTarget ? (
        <View className="gap-1.5">
          <FillBar progress={progress} accent="amber" className="w-full" />
          <Text className="text-zinc-500 text-xs">
            {remaining > 0
              ? `Te quedan ${remaining} kcal`
              : 'Objetivo alcanzado'}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

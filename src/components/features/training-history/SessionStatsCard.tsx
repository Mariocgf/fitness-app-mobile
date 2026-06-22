import { SessionStats } from '@/src/utils/training-history.utils';
import React from 'react';
import { Text, View } from 'react-native';

interface SessionStatsCardProps {
  stats: SessionStats;
}

/**
 * Card de resumen de la sesión: tres columnas separadas por divisores verticales
 * (Series completadas, Repeticiones, Esfuerzo promedio). Dark-only zinc / acento lime.
 * Los valores se computan desde los sets reales con `computeSessionStats`.
 */
export function SessionStatsCard({ stats }: SessionStatsCardProps) {
  const { completedSets, totalSets, totalReps, averageRpe } = stats;

  return (
    <View className="flex-row bg-zinc-900 border border-zinc-800 rounded-3xl px-2 py-5">
      {/* Series completadas */}
      <View className="flex-1 px-3">
        <Text className="text-zinc-500 text-xs mb-2" numberOfLines={1}>
          Series completadas
        </Text>
        <Text className="text-3xl font-bold">
          <Text className="text-lime-400">{completedSets}</Text>
          <Text className="text-zinc-500"> / {totalSets}</Text>
        </Text>
      </View>

      <View className="w-px bg-zinc-800" />

      {/* Repeticiones */}
      <View className="flex-1 px-3">
        <Text className="text-zinc-500 text-xs mb-2" numberOfLines={1}>
          Repeticiones
        </Text>
        <Text className="text-3xl font-bold text-white">{totalReps}</Text>
      </View>

      <View className="w-px bg-zinc-800" />

      {/* Esfuerzo promedio */}
      <View className="flex-1 px-3">
        <Text className="text-zinc-500 text-xs mb-2" numberOfLines={1}>
          Esfuerzo promedio
        </Text>
        <Text className="text-3xl font-bold">
          <Text className="text-lime-400">RPE </Text>
          <Text className="text-white">{averageRpe > 0 ? averageRpe : '—'}</Text>
        </Text>
      </View>
    </View>
  );
}

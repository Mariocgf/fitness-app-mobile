import { effortLabelFor } from '@/src/utils/rpe';
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
 *
 * El esfuerzo se muestra con la etiqueta de la escala, no con el número.
 */
export function SessionStatsCard({ stats }: SessionStatsCardProps) {
  const { completedSets, totalSets, totalReps, averageRpe } = stats;
  const effortLabel = effortLabelFor(averageRpe);

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

      {/* Esfuerzo promedio (etiqueta de la escala, nunca el número) */}
      <View className="flex-1 px-3">
        <Text className="text-zinc-500 text-xs mb-2" numberOfLines={1}>
          Esfuerzo promedio
        </Text>
        {/* `null` = ningún set con esfuerzo registrado. No se muestra un 0 inventado. */}
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          className={`text-2xl font-bold ${effortLabel ? 'text-lime-400' : 'text-zinc-500'}`}
        >
          {effortLabel ?? '—'}
        </Text>
      </View>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';
import { Routine } from '@/src/types/routine';

/** Acento del módulo Fitness (colors.md → lime-400). */
const LIME = '#a3e635';

interface RoutineTodayCardProps {
  /** Rutina activa del usuario. */
  routine: Routine;
  /** Abre la rutina en el módulo Fitness. */
  onPress: () => void;
}

/**
 * Card "Entrená hoy" del Home (dark-only zinc, acento lime-400). Solo se muestra
 * cuando hay rutina activa y el usuario todavía NO entrenó hoy. El día/meta se
 * computan del primer día de la rutina (el modelo no trae día de la semana).
 */
export function RoutineTodayCard({ routine, onPress }: RoutineTodayCardProps) {
  const firstDay = routine.days[0];
  const exerciseCount = firstDay?.exercises.length ?? 0;
  const meta =
    exerciseCount > 0
      ? `${exerciseCount} ejercicios · ${firstDay?.approxTimeSession ?? ''}`.trim()
      : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4"
    >
      <View className="flex-row items-center gap-4">
        <IconTile name="barbell" color={LIME} size={56} />
        <View className="flex-1">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
            Entrená hoy
          </Text>
          <Text className="text-white text-lg font-bold mt-0.5" numberOfLines={1}>
            {routine.name}
          </Text>
          {meta ? (
            <Text className="text-zinc-400 text-sm mt-0.5">{meta}</Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center justify-center gap-2 py-3 rounded-2xl bg-lime-400">
        <Text className="text-zinc-900 font-bold text-base">Comenzar rutina</Text>
        <Ionicons name="arrow-forward" size={18} color="#18181b" />
      </View>
    </TouchableOpacity>
  );
}

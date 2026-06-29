import { IconTile } from '@/src/components/common/IconTile';
import { NutritionRoutineSummaryDto } from '@/src/types/nutritionRoutine';
import {
  ROUTINE_STATUS_LABELS,
  formatRoutineDate,
} from '@/src/utils/nutritionRoutine.utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const AMBER = '#fbbf24';

interface NutritionRoutineListCardProps {
  routine: NutritionRoutineSummaryDto;
  onPress: (routine: NutritionRoutineSummaryDto) => void;
}

/**
 * Card del listado "Mis planes" de Nutrición (dark-only `zinc`, acento `amber-400`).
 *
 * Dos variantes según `routine.isActive`:
 * - Activa: card destacada con borde amber, badge "Activo" y CTA "Ver plan".
 * - Resto: fila compacta con icon-tile, nombre, `estado • N días` y chevron.
 *
 * NO muestra kcal ni macros: el resumen del backend solo trae id/name/status/dayCount/
 * fechas. Espeja `RoutineListCard` de Fitness (ver agent-implementation-lessons.md).
 */
export function NutritionRoutineListCard({ routine, onPress }: NutritionRoutineListCardProps) {
  const dayLabel = `${routine.dayCount} ${routine.dayCount === 1 ? 'día' : 'días'}`;
  const dateLabel = formatRoutineDate(routine.createdAt);

  if (routine.isActive) {
    return (
      <View className="rounded-3xl border border-amber-400 bg-zinc-900 p-4">
        <View className="flex-row items-center">
          <IconTile name="restaurant" color={AMBER} size={52} iconSize={26} />
          <View className="flex-1 ml-3 pr-2">
            <Text className="text-white font-bold text-lg" numberOfLines={1}>
              {routine.name}
            </Text>
            <Text className="text-zinc-400 text-sm mt-0.5">
              {dayLabel} • <Text className="text-amber-400 font-semibold">Activo</Text>
            </Text>
          </View>
          <View className="flex-row items-center bg-amber-400/15 px-2.5 py-1 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            <Text className="text-amber-400 text-xs font-semibold">Activo</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onPress(routine)}
          activeOpacity={0.85}
          className="flex-row items-center justify-center bg-amber-400 rounded-2xl py-3.5 mt-4"
        >
          <Text className="text-zinc-900 font-bold text-base mr-2">Ver plan</Text>
          <Ionicons name="arrow-forward" size={18} color="#18181b" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(routine)}
      activeOpacity={0.8}
      className="flex-row items-center rounded-2xl bg-zinc-900 border border-zinc-800 p-4"
    >
      <IconTile name="restaurant-outline" color={AMBER} size={48} iconSize={24} />
      <View className="flex-1 ml-3 pr-2">
        <Text className="text-white font-semibold text-base" numberOfLines={2}>
          {routine.name}
        </Text>
        <Text className="text-zinc-500 text-sm mt-0.5">
          {ROUTINE_STATUS_LABELS[routine.status]} • {dayLabel}
          {dateLabel ? ` • ${dateLabel}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#52525b" />
    </TouchableOpacity>
  );
}

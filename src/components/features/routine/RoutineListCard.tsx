import { IconTile } from '@/src/components/common/IconTile';
import { RoutineSummary } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const LIME = '#a3e635';

interface RoutineListCardProps {
  routine: RoutineSummary;
  onPress: (routine: RoutineSummary) => void;
}

/**
 * Card de la biblioteca "Mis rutinas" (listado vertical, dark-only, acento lime).
 *
 * Dos variantes según `routine.isActive`:
 * - Activa: card destacada con borde lime, badge "Activa" y CTA "Continuar rutina".
 * - Resto: fila compacta con icon-tile, nombre, `source • N días` y chevron.
 *
 * NO muestra "Nivel" ni íconos por grupo muscular: `RoutineSummary` no expone esos
 * campos, así que no se inventan (ver agent-implementation-lessons.md). El ícono se
 * deriva del source, igual que `RoutineLibraryCard`.
 */
export function RoutineListCard({ routine, onPress }: RoutineListCardProps) {
  const isAI = routine.source === 'AI';
  const iconName = isAI ? 'fitness' : 'barbell';
  const dayLabel = `${routine.dayCount} ${routine.dayCount === 1 ? 'día' : 'días'}`;

  if (routine.isActive) {
    return (
      <View className="rounded-3xl border border-lime-400 bg-zinc-900 p-4">
        <View className="flex-row items-center">
          <IconTile name={iconName} color={LIME} size={52} iconSize={26} />
          <View className="flex-1 ml-3 pr-2">
            <Text className="text-white font-bold text-lg" numberOfLines={1}>
              {routine.name}
            </Text>
            <Text className="text-zinc-400 text-sm mt-0.5">
              {dayLabel} • <Text className="text-lime-400 font-semibold">Activa</Text>
            </Text>
          </View>
          <View className="flex-row items-center bg-lime-400/15 px-2.5 py-1 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-lime-400 mr-1.5" />
            <Text className="text-lime-400 text-xs font-semibold">Activa</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onPress(routine)}
          activeOpacity={0.85}
          className="flex-row items-center justify-center bg-lime-400 rounded-2xl py-3.5 mt-4"
        >
          <Text className="text-zinc-900 font-bold text-base mr-2">Continuar rutina</Text>
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
      <IconTile name={iconName} color={LIME} size={48} iconSize={24} />
      <View className="flex-1 ml-3 pr-2">
        <Text className="text-white font-semibold text-base" numberOfLines={2}>
          {routine.name}
        </Text>
        <Text className="text-zinc-500 text-sm mt-0.5">
          {isAI ? 'IA' : 'Manual'} • {dayLabel}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#52525b" />
    </TouchableOpacity>
  );
}

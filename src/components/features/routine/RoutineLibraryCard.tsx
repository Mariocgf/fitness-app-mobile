import { RoutineSummary } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const LIME = '#a3e635';

interface RoutineLibraryCardProps {
  routine: RoutineSummary;
  onPress: (routine: RoutineSummary) => void;
  /** Si se pasa, muestra el botón de menú `···` arriba a la derecha. */
  onMenu?: (routine: RoutineSummary) => void;
}

/**
 * Card de la "Biblioteca de rutinas" (scroll horizontal, dark-only, acento lime).
 * Muestra: badge de source (IA/Manual), icon-tile, nombre y cantidad de días.
 * La rutina activa se resalta con borde lime.
 *
 * NO muestra "Nivel" (Intermedio/Avanzado): `RoutineSummary` no expone ese campo
 * estructurado, así que no se inventa (ver agent-implementation-lessons.md).
 */
export function RoutineLibraryCard({ routine, onPress, onMenu }: RoutineLibraryCardProps) {
  const isAI = routine.source === 'AI';

  return (
    <TouchableOpacity
      onPress={() => onPress(routine)}
      activeOpacity={0.85}
      className={`w-44 bg-zinc-900 rounded-2xl p-4 mr-3 border ${
        routine.isActive ? 'border-lime-400' : 'border-zinc-800'
      }`}
    >
      {/* Header: badge de source + menú opcional */}
      <View className="flex-row justify-between items-center mb-4">
        <View className={`px-2.5 py-1 rounded-full ${isAI ? 'bg-lime-400/15' : 'bg-zinc-800'}`}>
          <Text className={`text-xs font-semibold ${isAI ? 'text-lime-400' : 'text-zinc-400'}`}>
            {isAI ? 'IA' : 'Manual'}
          </Text>
        </View>
        {onMenu && (
          <TouchableOpacity
            onPress={() => onMenu(routine)}
            hitSlop={8}
            className="-mr-1 p-1"
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#71717a" />
          </TouchableOpacity>
        )}
      </View>

      {/* Icon-tile */}
      <View className="w-11 h-11 rounded-xl bg-zinc-800 items-center justify-center mb-3">
        <Ionicons name={isAI ? 'fitness' : 'barbell'} size={22} color={LIME} />
      </View>

      {/* Nombre */}
      <Text className="text-white font-bold text-base mb-3" numberOfLines={2}>
        {routine.name}
      </Text>

      {/* Días */}
      <View className="flex-row items-center mt-auto">
        <Ionicons name="calendar-outline" size={13} color="#71717a" />
        <Text className="text-zinc-400 text-sm ml-1.5">
          {routine.dayCount} {routine.dayCount === 1 ? 'día' : 'días'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

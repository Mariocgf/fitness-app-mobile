import { TrainingHistoryExercise } from '@/src/types/training-history';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SetsTable } from './SetsTable';

interface SessionExerciseCardProps {
  exercise: TrainingHistoryExercise;
  index: number;
  /** Estado inicial de expansión (por defecto colapsado) */
  defaultExpanded?: boolean;
}

/**
 * Card de un ejercicio dentro del detalle de sesión (dark-only zinc / acento lime).
 * Número en círculo, nombre, "N / M series completadas", badge RPE y listado de sets colapsable.
 * No muestra los músculos objetivo: la maqueta es más austera (ver agent-implementation-lessons).
 */
export function SessionExerciseCard({
  exercise,
  index,
  defaultExpanded = false,
}: SessionExerciseCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const displayName = exercise.exerciseNameEs || exercise.exerciseName || 'Ejercicio sin nombre';
  const completedSets = exercise.sets.filter((s) => s.isCompleted).length;

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl mb-4 overflow-hidden">
      {/* Header del ejercicio */}
      <TouchableOpacity
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
        className="flex-row items-center p-5"
      >
        {/* Número de ejercicio (círculo outline) */}
        <View className="w-11 h-11 rounded-full border border-zinc-700 items-center justify-center mr-4 flex-shrink-0">
          <Text className="text-zinc-300 text-base font-semibold">{index + 1}</Text>
        </View>

        <View className="flex-1 mr-3">
          <Text className="text-white font-semibold text-lg leading-6" numberOfLines={2}>
            {displayName}
          </Text>
          <Text className="text-zinc-500 text-sm mt-0.5">
            {completedSets} / {exercise.sets.length} series completadas
          </Text>
        </View>

        {/* Toggle chevron (el RPE ahora se muestra por set dentro de SetsTable) */}
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#a3e635" />
      </TouchableOpacity>

      {/* Listado de sets (colapsable) */}
      {expanded && (
        <View className="border-t border-zinc-800">
          <SetsTable sets={exercise.sets} />
        </View>
      )}
    </View>
  );
}

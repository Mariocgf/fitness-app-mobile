import { TrainingHistoryExercise } from '@/src/types/training-history';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SetsTable } from './SetsTable';

interface SessionExerciseCardProps {
  exercise: TrainingHistoryExercise;
  index: number;
}

/**
 * Card de un ejercicio dentro del detalle de sesión.
 * Muestra nombre (prefiere español), músculos objetivo, badge RPE y tabla de sets colapsable.
 */
export function SessionExerciseCard({ exercise, index }: SessionExerciseCardProps) {
  const [expanded, setExpanded] = useState(true);

  const displayName = exercise.exerciseNameEs ?? exercise.exerciseName;
  const completedSets = exercise.sets.filter((s) => s.isCompleted).length;

  return (
    <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-3 overflow-hidden">
      {/* Header del ejercicio */}
      <TouchableOpacity
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
        className="flex-row items-start p-4"
      >
        {/* Número de ejercicio */}
        <View className="w-7 h-7 rounded-full bg-lime-400 items-center justify-center mr-3 mt-0.5 flex-shrink-0">
          <Text className="text-slate-900 text-xs font-bold">{index + 1}</Text>
        </View>

        <View className="flex-1">
          {/* Nombre */}
          <Text className="text-slate-900 dark:text-slate-50 font-semibold text-sm leading-5" numberOfLines={2}>
            {displayName}
          </Text>

          {/* Músculos objetivo */}
          {exercise.targetMuscles.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mt-1">
              {exercise.targetMuscles.map((muscle) => (
                <View
                  key={muscle}
                  className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"
                >
                  <Text className="text-slate-600 dark:text-slate-400 text-xs capitalize">
                    {muscle}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* RPE y resumen de sets */}
          <View className="flex-row items-center gap-3 mt-2">
            {exercise.rpe > 0 && (
              <View className="flex-row items-center">
                <View className="bg-lime-400/20 px-2 py-0.5 rounded-full flex-row items-center">
                  <Ionicons name="speedometer-outline" size={11} color="#65a30d" />
                  <Text className="text-lime-700 dark:text-lime-400 text-xs font-semibold ml-1">
                    RPE {exercise.rpe}
                  </Text>
                </View>
              </View>
            )}
            <Text className="text-slate-500 dark:text-slate-400 text-xs">
              {completedSets}/{exercise.sets.length} sets completados
            </Text>
          </View>
        </View>

        {/* Toggle chevron */}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#94a3b8"
          style={{ marginTop: 2 }}
        />
      </TouchableOpacity>

      {/* Tabla de sets (colapsable) */}
      {expanded && (
        <View className="px-4 pb-4">
          <SetsTable sets={exercise.sets} />
        </View>
      )}
    </View>
  );
}

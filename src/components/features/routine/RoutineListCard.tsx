import { RoutineSummary, RoutineSource } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface RoutineListCardProps {
  routine: RoutineSummary;
  onPress: (routine: RoutineSummary) => void;
}

/**
 * Card para listado vertical de rutinas (vista paginada).
 * Muestra: nombre, tag de source, badge "Activa", fechas y cantidad de días.
 */
export function RoutineListCard({ routine, onPress }: RoutineListCardProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getSourceStyles = (source: RoutineSource) => {
    if (source === 'AI') {
      return {
        container: 'bg-violet-100 dark:bg-violet-900/30',
        text: 'text-violet-700 dark:text-violet-300',
      };
    }
    return {
      container: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
    };
  };

  const sourceStyles = getSourceStyles(routine.source);

  return (
    <TouchableOpacity
      onPress={() => onPress(routine)}
      activeOpacity={0.8}
      className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
    >
      {/* Header: Nombre y badge Activa */}
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-slate-900 dark:text-slate-50 font-semibold text-base flex-1 mr-2"
          numberOfLines={2}
        >
          {routine.name}
        </Text>
        {routine.isActive && (
          <View className="flex-row items-center bg-lime-400 px-2 py-1 rounded-full">
            <Ionicons name="checkmark" size={12} color="#0f172a" />
            <Text className="text-slate-900 text-xs font-medium ml-1">Activa</Text>
          </View>
        )}
      </View>

      {/* Tags y metadata */}
      <View className="flex-row items-center flex-wrap gap-2 mb-3">
        {/* Tag de source */}
        <View className={`px-2 py-1 rounded-full ${sourceStyles.container}`}>
          <Text className={`text-xs font-medium ${sourceStyles.text}`}>
            {routine.source === 'AI' ? 'Generada por IA' : 'Creada manual'}
          </Text>
        </View>

        {/* Cantidad de días */}
        <View className="flex-row items-center px-2 py-1">
          <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
          <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">
            {routine.dayCount} {routine.dayCount === 1 ? 'día' : 'días'}
          </Text>
        </View>
      </View>

      {/* Fechas */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={12} color="#94a3b8" />
          <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">
            Creada: {formatDate(routine.createdAt)}
          </Text>
        </View>

        <Text className="text-slate-400 dark:text-slate-500 text-xs">
          {routine.updatedAt
            ? `Modificada: ${formatDate(routine.updatedAt)}`
            : 'No modificada'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

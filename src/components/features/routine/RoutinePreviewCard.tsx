import { RoutineSummary, RoutineSource } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface RoutinePreviewCardProps {
  routine: RoutineSummary;
  onPress: (routine: RoutineSummary) => void;
}

/**
 * Card compacta para mostrar rutinas en scroll horizontal.
 * Muestra: nombre, tag de source, badge "Activa" si aplica, y cantidad de días.
 */
export function RoutinePreviewCard({ routine, onPress }: RoutinePreviewCardProps) {
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
      className="w-40 bg-white dark:bg-slate-900 rounded-xl p-3 mr-3 border border-slate-200 dark:border-slate-800"
    >
      {/* Header con tag de source */}
      <View className="flex-row justify-between items-start mb-2">
        <View className={`px-2 py-1 rounded-full ${sourceStyles.container}`}>
          <Text className={`text-xs font-medium ${sourceStyles.text}`}>
            {routine.source === 'AI' ? 'IA' : 'Manual'}
          </Text>
        </View>
        {routine.isActive && (
          <View className="bg-lime-400 px-1.5 py-0.5 rounded-full">
            <Ionicons name="checkmark" size={10} color="#0f172a" />
          </View>
        )}
      </View>

      {/* Nombre de la rutina */}
      <Text
        className="text-slate-900 dark:text-slate-50 font-semibold text-sm mb-2"
        numberOfLines={2}
      >
        {routine.name}
      </Text>

      {/* Info de días */}
      <View className="flex-row items-center mt-auto">
        <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
        <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">
          {routine.dayCount} {routine.dayCount === 1 ? 'día' : 'días'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

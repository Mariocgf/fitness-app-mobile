import { TrainingHistorySession } from '@/src/types/training-history';
import { formatDurationLong, formatSessionDate } from '@/src/utils/training-history.utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TrainingHistoryListCardProps {
  session: TrainingHistorySession;
  onPress: (session: TrainingHistorySession) => void;
}

/**
 * Card vertical para la lista paginada de historial de entrenamiento.
 * Muestra: nombre de rutina, fecha, duración total y cantidad de ejercicios.
 */
export function TrainingHistoryListCard({
  session,
  onPress,
}: TrainingHistoryListCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(session)}
      activeOpacity={0.8}
      className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
    >
      {/* Nombre + flecha */}
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-slate-900 dark:text-slate-50 font-semibold text-base flex-1 mr-2"
          numberOfLines={2}
        >
          {session.routineName}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>

      {/* Chips de metadata */}
      <View className="flex-row items-center flex-wrap gap-2 mb-3">
        <View className="bg-lime-400/20 px-2 py-1 rounded-full flex-row items-center">
          <Ionicons name="barbell-outline" size={11} color="#65a30d" />
          <Text className="text-lime-700 dark:text-lime-400 text-xs font-medium ml-1">
            {session.exercises.length} {session.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
          </Text>
        </View>
        <View className="flex-row items-center px-2 py-1">
          <Ionicons name="time-outline" size={11} color="#94a3b8" />
          <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">
            {formatDurationLong(session.totalSeconds)}
          </Text>
        </View>
      </View>

      {/* Fecha */}
      <View className="flex-row items-center">
        <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
        <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">
          {formatSessionDate(session.trainedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

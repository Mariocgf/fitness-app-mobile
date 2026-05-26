import { TrainingHistorySession } from '@/src/types/training-history';
import { formatDurationLong, formatSessionDate } from '@/src/utils/training-history.utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TrainingHistoryPreviewCardProps {
  session: TrainingHistorySession;
  onPress: (session: TrainingHistorySession) => void;
}

/**
 * Card compacta para el scroll horizontal de historial en la pantalla principal de fitness.
 * Muestra: nombre de rutina, fecha corta, duración y cantidad de ejercicios.
 */
export function TrainingHistoryPreviewCard({
  session,
  onPress,
}: TrainingHistoryPreviewCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(session)}
      activeOpacity={0.8}
      className="w-44 bg-white dark:bg-slate-900 rounded-xl p-3 mr-3 border border-slate-200 dark:border-slate-800"
    >
      {/* Chip de cantidad de ejercicios */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="bg-lime-400/20 px-2 py-1 rounded-full">
          <Text className="text-lime-700 dark:text-lime-400 text-xs font-medium">
            {session.exercises.length} ejerc.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
      </View>

      {/* Nombre de la rutina */}
      <Text
        className="text-slate-900 dark:text-slate-50 font-semibold text-sm mb-2"
        numberOfLines={2}
      >
        {session.routineName}
      </Text>

      {/* Fecha */}
      <View className="flex-row items-center mb-1">
        <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
        <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1" numberOfLines={1}>
          {formatSessionDate(session.trainedAt)}
        </Text>
      </View>

      {/* Duración */}
      <View className="flex-row items-center">
        <Ionicons name="time-outline" size={11} color="#94a3b8" />
        <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">
          {formatDurationLong(session.totalSeconds)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

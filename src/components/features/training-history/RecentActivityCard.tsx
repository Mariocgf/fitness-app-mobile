import { TrainingHistorySession } from '@/src/types/training-history';
import { formatDurationLong, formatRelativeDay } from '@/src/utils/training-history.utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const LIME = '#a3e635';

interface RecentActivityCardProps {
  session: TrainingHistorySession;
  onPress: (session: TrainingHistorySession) => void;
}

/**
 * Fila de "Actividad reciente" del módulo Fitness (dark-only, acento lime).
 * Muestra el último entrenamiento: icon-tile, nombre de la rutina y una meta
 * compacta "N ejercicios • duración • Hace X". Ancho completo (no scroll).
 */
export function RecentActivityCard({ session, onPress }: RecentActivityCardProps) {
  const exerciseCount = session.exercises.length;
  const meta = [
    `${exerciseCount} ${exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}`,
    formatDurationLong(session.totalSeconds),
    formatRelativeDay(session.trainedAt),
  ].join('  •  ');

  return (
    <TouchableOpacity
      onPress={() => onPress(session)}
      activeOpacity={0.85}
      className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mx-4"
    >
      {/* Icon-tile */}
      <View className="w-14 h-14 rounded-2xl bg-zinc-800 items-center justify-center mr-4">
        <Ionicons name="barbell" size={26} color={LIME} />
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-zinc-500 text-xs mb-0.5">Último entrenamiento</Text>
        <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
          {session.routineName}
        </Text>
        <Text className="text-zinc-400 text-xs" numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#71717a" />
    </TouchableOpacity>
  );
}

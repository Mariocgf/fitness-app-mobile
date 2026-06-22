import { SessionExercise } from '@/src/types/session';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { ExerciseGif } from './ExerciseGif';

interface NextExerciseCardProps {
  nextExercise: SessionExercise;
  isLastSession?: boolean;
}

/**
 * "Siguiente ejercicio" de la fase de descanso (dark `zinc`/`lime`).
 * Miniatura + label uppercase + nombre. En la última serie muestra la variante
 * celebratoria en `lime-400`.
 */
export const NextExerciseCard: React.FC<NextExerciseCardProps> = ({ nextExercise, isLastSession }) => {
  if (isLastSession) {
    return (
      <View className="bg-lime-400 rounded-3xl p-4 flex-row items-center gap-4">
        <View className="w-14 h-14 rounded-2xl bg-lime-300 items-center justify-center">
          <Ionicons name="trophy" size={28} color="#1a2e05" />
        </View>
        <View className="flex-1">
          <Text className="text-lime-900 text-sm font-medium">¡Última serie!</Text>
          <Text className="text-lime-950 font-bold text-base">Fin de la sesión</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-4">
      <View className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-900">
        {nextExercise?.gifUrl ? (
          <ExerciseGif uri={nextExercise.gifUrl} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={28} color="#52525b" />
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
          Siguiente ejercicio
        </Text>
        <Text className="text-white font-semibold text-lg mt-1" numberOfLines={2}>
          {nextExercise?.name}
        </Text>
      </View>
    </View>
  );
};

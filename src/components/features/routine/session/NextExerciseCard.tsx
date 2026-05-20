import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { ExerciseGif } from './ExerciseGif';
import { SessionExercise } from '@/src/types/session';

interface NextExerciseCardProps {
  nextExercise: SessionExercise;
}

export const NextExerciseCard: React.FC<NextExerciseCardProps> = ({ nextExercise }) => {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-4 flex-row items-center gap-4">
      <View className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        {nextExercise?.gifUrl ? (
          <ExerciseGif uri={nextExercise.gifUrl} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={28} color="#94a3b8" />
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-slate-500 dark:text-slate-400 text-sm">Proximo ejercicio</Text>
        <Text className="text-slate-900 dark:text-slate-50 font-semibold" numberOfLines={2}>
          {nextExercise?.name}
        </Text>
      </View>
    </View>
  );
};

import { formatReps } from '@/src/utils/format.utils';
import React from 'react';
import { Text, View } from 'react-native';
import { SessionExercise } from '@/src/types/session';

interface ExerciseStatsBarProps {
  currentSet: number;
  totalSets: number;
  currentExercise: SessionExercise;
}

export const ExerciseStatsBar: React.FC<ExerciseStatsBarProps> = ({
  currentSet,
  totalSets,
  currentExercise,
}) => {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl px-2 py-2 flex-row justify-between">
      <View className="items-center flex-1">
        <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">Series</Text>
        <Text className="text-lime-400 text-lg font-bold text-center">
          {currentSet}/{totalSets}
        </Text>
      </View>
      <View className="items-center flex-1">
        <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">Repeticiones</Text>
        <Text className="text-lime-400 text-lg font-bold text-center">
          {formatReps(currentExercise)}
        </Text>
      </View>
      <View className="items-center flex-1">
        <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">Peso</Text>
        <Text className="text-lime-400 text-lg font-bold text-center">{currentExercise.weight}</Text>
      </View>
      <View className="items-center flex-1">
        <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">Descanso</Text>
        <Text className="text-lime-400 text-lg font-bold text-center">{currentExercise.rest}s</Text>
      </View>
    </View>
  );
};

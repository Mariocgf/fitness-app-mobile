import { formatTime } from '@/src/utils/format.utils';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SummaryStats {
  exercisesDone: number;
  exercisesTotal: number;
  setsDone: number;
  setsTotal: number;
  repsDone: number;
  repsTotal: number;
  avgRpe: number;
}

interface SummaryPhaseProps {
  globalTime: number;
  stats: SummaryStats;
  onSave: () => void;
}

interface StatCardProps {
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <View className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4">
    <Text className="text-slate-900 dark:text-slate-50 text-sm font-medium mb-2">{label}</Text>
    <Text className="text-lime-400 text-2xl font-bold">{value}</Text>
  </View>
);

export const SummaryPhase: React.FC<SummaryPhaseProps> = ({ globalTime, stats, onSave }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-slate-100 dark:bg-slate-950 px-4"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      {/* Título + tiempo */}
      <View className="mb-8">
        <Text className="text-slate-900 dark:text-slate-50 text-5xl font-black leading-tight">
          {'Sesión\ncompletada'}
        </Text>
        <Text className="text-slate-900 dark:text-slate-50 text-5xl font-black italic mt-1">
          {formatTime(globalTime)}
        </Text>
      </View>

      {/* Resumen */}
      <Text className="text-slate-900 dark:text-slate-50 text-lg font-semibold mb-3">
        Resumen
      </Text>

      <View className="gap-3">
        <View className="flex-row gap-3">
          <StatCard
            label="Ejercicios realizados"
            value={`${stats.exercisesDone}/${stats.exercisesTotal}`}
          />
          <StatCard
            label="Series completadas"
            value={`${stats.setsDone}/${stats.setsTotal}`}
          />
        </View>
        <View className="flex-row gap-3">
          <StatCard
            label="Repeticiones completadas"
            value={`${stats.repsDone}/${stats.repsTotal}`}
          />
          <StatCard
            label="Esfuerzo promedio"
            value={`${stats.avgRpe}`}
          />
        </View>
      </View>

      {/* Spacer */}
      <View className="flex-1" />

      {/* Botón */}
      <TouchableOpacity
        className="bg-zinc-950 dark:bg-zinc-50 w-full h-14 rounded-full items-center justify-center"
        onPress={onSave}
      >
        <Text className="text-white dark:text-zinc-950 font-semibold text-base">Continuar</Text>
      </TouchableOpacity>
    </View>
  );
};

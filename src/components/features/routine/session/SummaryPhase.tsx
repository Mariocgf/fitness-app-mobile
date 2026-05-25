import { ExerciseLog, SessionExercise } from '@/src/types/session';
import { formatTime } from '@/src/utils/format.utils';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
  logs: ExerciseLog[];
  exercises: SessionExercise[];
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

export const SummaryPhase: React.FC<SummaryPhaseProps> = ({
  globalTime,
  stats,
  logs,
  exercises,
  onSave,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-slate-100 dark:bg-slate-950"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
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

        {/* Stats generales */}
        <Text className="text-slate-900 dark:text-slate-50 text-lg font-semibold mb-3">
          Resumen
        </Text>
        <View className="gap-3 mb-6">
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

        {/* Detalle por ejercicio */}
        <Text className="text-slate-900 dark:text-slate-50 text-lg font-semibold mb-3">
          Detalle
        </Text>
        <View className="gap-3">
          {exercises.map((ex) => {
            const log = logs.find((l) => l.exerciseId === ex.id);
            const isTimeBased = ex.repType === 'Timed';
            const targetSets = parseInt(ex.sets) || 1;
            const targetReps = parseInt(ex.currentRep || ex.maxRep || ex.minRep || '0', 10);
            const targetDuration = parseInt(ex.durationSeconds || '0', 10);

            return (
              <View key={ex.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4">
                <Text
                  className="text-slate-900 dark:text-slate-50 font-bold text-base mb-3"
                  numberOfLines={1}
                >
                  {ex.name}
                </Text>

                {/* Fila encabezado */}
                <View className="flex-row mb-2">
                  <Text className="w-14 text-slate-400 text-xs font-medium">Serie</Text>
                  <Text className="flex-1 text-slate-400 text-xs font-medium text-center">
                    {isTimeBased ? 'Duración' : 'Reps'}
                  </Text>
                  <Text className="w-20 text-slate-400 text-xs font-medium text-right">
                    Estado
                  </Text>
                </View>

                {/* Sets realizados */}
                {log && log.sets.length > 0 ? (
                  log.sets.map((set) => {
                    const done = isTimeBased
                      ? `${set.durationSeconds ?? 0}s`
                      : `${set.repsPerformed}`;
                    const target = isTimeBased
                      ? `${targetDuration}s`
                      : `${targetReps}`;

                    return (
                      <View key={set.setNumber} className="flex-row items-center py-1.5 border-t border-slate-100 dark:border-slate-800">
                        <Text className="w-14 text-slate-900 dark:text-slate-50 text-sm">
                          {set.setNumber}
                        </Text>
                        <Text className="flex-1 text-slate-900 dark:text-slate-50 text-sm font-semibold text-center">
                          {done}
                          <Text className="text-slate-400 font-normal"> / {target}</Text>
                        </Text>
                        <View className="w-20 items-end">
                          <View
                            className={`px-2 py-0.5 rounded-full ${
                              set.isCompleted
                                ? 'bg-lime-100 dark:bg-lime-900'
                                : 'bg-orange-100 dark:bg-orange-900'
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                set.isCompleted
                                  ? 'text-lime-700 dark:text-lime-300'
                                  : 'text-orange-700 dark:text-orange-300'
                              }`}
                            >
                              {set.isCompleted ? 'Completa' : 'Parcial'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : null}

                {/* Sets no realizados */}
                {Array.from({
                  length: Math.max(0, targetSets - (log?.sets.length ?? 0)),
                }).map((_, i) => {
                  const setNumber = (log?.sets.length ?? 0) + i + 1;
                  return (
                    <View key={`pending-${setNumber}`} className="flex-row items-center py-1.5 border-t border-slate-100 dark:border-slate-800">
                      <Text className="w-14 text-slate-400 text-sm">{setNumber}</Text>
                      <Text className="flex-1 text-slate-400 text-sm text-center">—</Text>
                      <View className="w-20 items-end">
                        <View className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          <Text className="text-xs font-medium text-slate-400">No hecha</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Botón */}
      <View className="px-4 pt-4">
        <TouchableOpacity
          className="bg-zinc-950 dark:bg-zinc-50 w-full h-14 rounded-full items-center justify-center"
          onPress={onSave}
        >
          <Text className="text-white dark:text-zinc-950 font-semibold text-base">Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

import { SessionExercise } from '@/src/types/session';
import { formatExerciseLoad, formatReps, formatTargetReps, formatTime } from '@/src/utils/format.utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ExerciseGif } from './ExerciseGif';
import { InstructionsModal } from './InstructionsModal';

interface ExercisePhaseProps {
  currentExercise: SessionExercise;
  currentSet: number;
  totalSets: number;
  isTimeBased: boolean;
  exerciseTimeLeft: number | null;
  globalTime: number;
  showInstructions: boolean;
  onCloseInstructions: () => void;
}

/**
 * Contenido de la fase de ejecución (dark `zinc`/`lime`): GIF hero, timer,
 * "Serie N de M" y subtítulo reps•peso. NO incluye header ni la sección de
 * botones — esos viven en `ActiveSessionView` y quedan fijos (fuera del
 * cross-fade entre fases).
 */
export const ExercisePhase: React.FC<ExercisePhaseProps> = ({
  currentExercise,
  currentSet,
  totalSets,
  isTimeBased,
  exerciseTimeLeft,
  globalTime,
  showInstructions,
  onCloseInstructions,
}) => {
  /* Timer activo: cuenta regresiva en ejercicios por tiempo, cronómetro global en el resto */
  const timeLabel = formatTime(isTimeBased ? exerciseTimeLeft ?? 0 : globalTime);

  /* Objetivo de la serie: reps (o duración si es por tiempo) + carga.
     Los tres son los valores que el ajuste de carga puede cambiar, así que se leen
     SIEMPRE del ejercicio en curso: apenas el backend devuelve un ajuste, el hook pisa
     `currentRep`/`plannedWeightKg`/`durationSeconds` y esto se re-renderiza con lo nuevo. */
  const repsLabel = isTimeBased
    ? formatReps(currentExercise)
    : `${formatTargetReps(currentExercise)} repeticiones`;
  const loadLabel = formatExerciseLoad(currentExercise);

  return (
    <>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* GIF hero */}
        <View className="w-full aspect-square rounded-3xl overflow-hidden bg-zinc-900 mt-2">
          {currentExercise.gifUrl ? (
            <ExerciseGif uri={currentExercise.gifUrl} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="image-outline" size={48} color="#52525b" />
            </View>
          )}
        </View>

        {/* Timer */}
        <Text className="text-lime-400 text-base font-medium mt-6">{timeLabel}</Text>

        {/* Serie actual */}
        <Text className="text-white text-5xl font-bold mt-1">
          Serie <Text className="text-lime-400">{currentSet}</Text> de {totalSets}
        </Text>

        {/* Objetivo: reps • peso */}
        <Text className="text-zinc-400 text-lg mt-2">
          {repsLabel}
          {loadLabel !== '-' ? (
            <Text>
              {'  '}
              <Text className="text-lime-400">•</Text> {loadLabel}
            </Text>
          ) : null}
        </Text>
      </ScrollView>

      <InstructionsModal
        visible={showInstructions}
        onClose={onCloseInstructions}
        exerciseId={currentExercise.exerciseId}
        exerciseName={currentExercise.name}
      />
    </>
  );
};

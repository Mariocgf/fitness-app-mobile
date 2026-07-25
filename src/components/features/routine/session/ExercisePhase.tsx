import { SessionExercise } from '@/src/types/session';
import { formatExerciseLoad, formatReps, formatTargetReps, formatTime } from '@/src/utils/format.utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
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
      {/* Layout en dos partes: el GIF ABSORBE el espacio sobrante y el bloque de datos
          (timer, serie, reps•peso) queda FIJO abajo. Antes todo vivía dentro de un
          ScrollView: en pantallas cortas —y en la PWA, donde el viewport pierde el alto
          de la barra del sistema— el bloque de datos caía fuera del área visible y
          parecía "tapado" por los botones. Ahora nunca se recorta: si falta lugar, el
          que se achica es el GIF. */}
      <View className="flex-1 px-5">
        {/* GIF hero: el cuadrado más grande que entre en el espacio disponible */}
        <View className="flex-1 items-center justify-center mt-2 overflow-hidden">
          <View
            className="rounded-3xl overflow-hidden bg-zinc-900"
            style={{ height: '100%', aspectRatio: 1, maxWidth: '100%' }}
          >
            {currentExercise.gifUrl ? (
              <ExerciseGif uri={currentExercise.gifUrl} />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="image-outline" size={48} color="#52525b" />
              </View>
            )}
          </View>
        </View>

        {/* Timer */}
        <Text className="text-lime-400 text-base font-medium mt-6">{timeLabel}</Text>

        {/* Serie actual */}
        <Text className="text-white text-5xl font-bold mt-1" adjustsFontSizeToFit numberOfLines={1}>
          Serie <Text className="text-lime-400">{currentSet}</Text> de {totalSets}
        </Text>

        {/* Objetivo: reps • peso */}
        <Text className="text-zinc-400 text-lg mt-2 mb-2">
          {repsLabel}
          {loadLabel !== '-' ? (
            <Text>
              {'  '}
              <Text className="text-lime-400">•</Text> {loadLabel}
            </Text>
          ) : null}
        </Text>
      </View>

      <InstructionsModal
        visible={showInstructions}
        onClose={onCloseInstructions}
        exerciseId={currentExercise.exerciseId}
        exerciseName={currentExercise.name}
      />
    </>
  );
};

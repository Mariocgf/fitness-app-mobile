import { FillBar } from '@/src/components/common/FillBar';
import { SessionSlider } from '@/src/components/common/SessionSlider';
import { RepetitionMode } from '@/src/hooks/useActiveSession';
import { SessionExercise } from '@/src/types/session';
import { formatTime } from '@/src/utils/format.utils';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { EffortSection } from './EffortSection';
import { NextExerciseCard } from './NextExerciseCard';

interface RestPhaseProps {
  restTimeLeft: number;
  initialRest: number;
  nextExercise: SessionExercise;
  isLastSession: boolean;
  /** Esfuerzo de la serie recién terminada; `null` si el usuario no tocó nada. */
  rpe: number | null;
  onRpeChange: (value: number) => void;
  onAdjustLoad: () => void;
  canAdjustLoad: boolean;
  isAdjustingLoad: boolean;
  isOffline?: boolean;
  repetitionMode: RepetitionMode;
  partialReps: number;
  onPartialRepsChange: (value: number) => void;
  repetitionMax: number;
}

/**
 * Contenido de la fase de descanso (dark `zinc`/`lime`): timer countdown grande
 * + barra de progreso, "Siguiente ejercicio", el selector de esfuerzo de la serie
 * que acaba de terminar (+ el ajuste de carga, opcional) y las reps realizadas si
 * la serie fue incompleta. NO incluye header ni la sección de botones — esos viven
 * en `ActiveSessionView` y quedan fijos (fuera del cross-fade entre fases).
 *
 * No hay botón "Omitir" y no hace falta: si el descanso termina y el usuario arranca
 * la siguiente serie sin tocar nada, eso ya es omitir (se envía `null`).
 */
export const RestPhase: React.FC<RestPhaseProps> = ({
  restTimeLeft,
  initialRest,
  nextExercise,
  isLastSession,
  rpe,
  onRpeChange,
  onAdjustLoad,
  canAdjustLoad,
  isAdjustingLoad,
  isOffline = false,
  repetitionMode,
  partialReps,
  onPartialRepsChange,
  repetitionMax,
}) => {
  const progress = initialRest > 0 ? restTimeLeft / initialRest : 0;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Timer countdown + barra de progreso */}
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        className="text-lime-400 text-8xl font-bold text-center mt-6"
      >
        {formatTime(restTimeLeft)}
      </Text>
      <FillBar progress={progress} accent="lime" className="w-full mt-4" />

      {/* Siguiente ejercicio */}
      <View className="mt-8">
        <NextExerciseCard nextExercise={nextExercise} isLastSession={isLastSession} />
      </View>

      {/* Esfuerzo percibido de la serie + ajuste de carga (acciones separadas) */}
      <View className="border-t border-zinc-800 mt-6 pt-6">
        <EffortSection
          rpe={rpe}
          onRpeChange={onRpeChange}
          onAdjustLoad={onAdjustLoad}
          canAdjustLoad={canAdjustLoad}
          isAdjustingLoad={isAdjustingLoad}
          isOffline={isOffline}
        />
      </View>

      {/* Repeticiones realizadas (solo si la serie fue incompleta) */}
      {repetitionMode === 'partial' && (
        <View className="border-t border-zinc-800 mt-6 pt-6">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Repeticiones realizadas
          </Text>
          <SessionSlider
            value={partialReps}
            onValueChange={onPartialRepsChange}
            min={0}
            max={repetitionMax}
            forceDark
          />
        </View>
      )}
    </ScrollView>
  );
};

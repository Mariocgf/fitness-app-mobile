import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import { useAuth } from '@clerk/clerk-expo';
import { SessionDay, SessionLog, ExerciseLog, SessionExercise } from '@/src/types/session';
import { adjustExerciseLoad } from '@/src/services/exercise.service';
import { formatTime, formatReps, formatTimeSpan } from '@/src/utils/format.utils';
import { RPESlider } from './RPESlider';
import { ClockCircle } from '@/src/components/common/ClockCircle';
import { InstructionsModal } from './InstructionsModal';
import { ExerciseGif } from './ExerciseGif';

type Phase = 'COUNTDOWN' | 'EXERCISE' | 'REST' | 'SUMMARY';

interface ActiveSessionViewProps {
  routineId: string;
  day: SessionDay;
  onFinishSession?: (log: SessionLog) => void;
  onCancel?: () => void;
}

/* ════════════════════════════════════════════════════════════════════ */
/*                      COMPONENTE PRINCIPAL                          */
/* ════════════════════════════════════════════════════════════════════ */

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  routineId,
  day,
  onFinishSession,
  onCancel,
}) => {
  const { getToken } = useAuth();
  const { width: screenWidth } = Dimensions.get('window');
  const dynamicClockSize = screenWidth * 0.40; // 40% del ancho de pantalla

  const [phase, setPhase] = useState<Phase>('COUNTDOWN');
  const [countdown, setCountdown] = useState(3);

  const [exercises, setExercises] = useState<SessionExercise[]>(day.exercises);

  const [globalTime, setGlobalTime] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [rpe, setRpe] = useState(5);
  const [rpeSaved, setRpeSaved] = useState(false);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState<number | null>(null);
  const [isAdjustingLoad, setIsAdjustingLoad] = useState(false);

  const currentExercise = exercises[exerciseIndex];
  const totalSets = parseInt(currentExercise?.sets) || 1;
  const initialRest = parseInt(currentExercise?.rest) || 60;

  const isTimeBased = currentExercise?.repType === 'Timed';
  const timeBasedDuration = isTimeBased ? parseInt(currentExercise?.durationSeconds || '0', 10) : 0;

  /* ── countdown ── */
  useEffect(() => {
    if (phase !== 'COUNTDOWN') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    // Muestra "¡Vamos!" por 1 segundo antes de iniciar
    const t = setTimeout(() => setPhase('EXERCISE'), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase]);

  /* ── timer global ── */
  useEffect(() => {
    if (phase !== 'EXERCISE' && phase !== 'REST') return;
    const t = setInterval(() => setGlobalTime((g) => g + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  /* ── countdown de descanso ── */
  useEffect(() => {
    if (phase !== 'REST') return;
    if (restTimeLeft <= 0) return;
    const t = setInterval(() => {
      setRestTimeLeft((r) => {
        if (r <= 1) {
          clearInterval(t);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, restTimeLeft > 0]);

  /* ── auto-avance cuando el descanso llega a 0 ── */
  useEffect(() => {
    if (phase === 'REST' && restTimeLeft === 0 && initialRest > 0) {
      // Pequeña pausa para que el usuario vea 00:00
      const t = setTimeout(() => advanceAfterRest(), 500);
      return () => clearTimeout(t);
    }
  }, [phase, restTimeLeft]);

  /* ── countdown de ejercicio (Timed) ── */
  useEffect(() => {
    if (phase === 'EXERCISE' && isTimeBased) {
      setExerciseTimeLeft(timeBasedDuration);
    } else {
      setExerciseTimeLeft(null);
    }
  }, [phase, isTimeBased, timeBasedDuration, exerciseIndex, currentSet]);

  useEffect(() => {
    if (phase !== 'EXERCISE' || !isTimeBased || exerciseTimeLeft === null || exerciseTimeLeft <= 0) return;
    const t = setInterval(() => {
      setExerciseTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, isTimeBased, exerciseTimeLeft]);

  /* ── helpers ── */

  const saveCurrentLog = useCallback(
    (finalRpe: number) => {
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.exerciseId === currentExercise.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], rpe: finalRpe };
          return copy;
        }
        return [
          ...prev,
          { exerciseId: currentExercise.id, rpe: finalRpe, totalWeight: 0 },
        ];
      });
    },
    [currentExercise?.id],
  );

  const advanceAfterRest = useCallback(() => {
    // Guarda RPE (si el usuario no presionó "Guardar", valor por defecto 5)
    if (!rpeSaved) saveCurrentLog(5);

    if (currentSet < totalSets) {
      setCurrentSet((s) => s + 1);
    } else {
      setExerciseIndex((i) => i + 1);
      setCurrentSet(1);
    }
    setRpeSaved(false);
    setRpe(5);
    setPhase('EXERCISE');
  }, [currentSet, totalSets, rpeSaved, saveCurrentLog]);

  const handleFinishSet = useCallback(() => {
    const isLastSet = currentSet >= totalSets;
    const isLastExercise = exerciseIndex >= day.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      saveCurrentLog(5);
      setPhase('SUMMARY');
      return;
    }

    // Inicia descanso
    setRestTimeLeft(initialRest);
    setRpe(5);
    setRpeSaved(false);
    setPhase('REST');
  }, [currentSet, totalSets, exerciseIndex, exercises.length, saveCurrentLog, initialRest]);

  useEffect(() => {
    if (phase === 'EXERCISE' && isTimeBased && exerciseTimeLeft === 0) {
      handleFinishSet();
    }
  }, [phase, isTimeBased, exerciseTimeLeft, handleFinishSet]);

  /** Guarda el RPE y ajusta la carga si el valor está fuera del rango neutral */
  const handleSaveRpe = async () => {
    if (rpe >= 4 && rpe <= 6) {
      saveCurrentLog(rpe);
      setRpeSaved(true);
      return;
    }

    setIsAdjustingLoad(true);
    try {
      const token = await getToken();
      const adjustment = await adjustExerciseLoad(currentExercise.id, day.id, rpe, token);

      if (!adjustment.weight && !adjustment.currentRep && !adjustment.durationSeconds) {
        Alert.alert("Aviso", "No se pudo ajustar la carga para este ejercicio.");
      } else {
        setExercises((prev) => {
          const newEx = [...prev];
          const curr = { ...newEx[exerciseIndex] };
          if (adjustment.weight !== null) curr.weight = adjustment.weight;
          if (adjustment.currentRep !== null) curr.currentRep = adjustment.currentRep;
          if (adjustment.durationSeconds !== null) curr.durationSeconds = adjustment.durationSeconds;
          newEx[exerciseIndex] = curr;
          return newEx;
        });
        saveCurrentLog(rpe);
        setRpeSaved(true);
      }
    } catch (error: any) {
      Alert.alert("Error", "No se pudo ajustar la carga. Intente nuevamente.");
      console.log('STATUS:', error?.response?.status);
      console.log('DATA:', error?.response?.data);
      console.log('MESSAGE:', error?.message);
    } finally {
      setIsAdjustingLoad(false);
    }
  };

  const handleFinishRest = () => {
    advanceAfterRest();
  };

  const handleFinishSessionEarly = () => {
    Alert.alert(
      'Finalizar Sesión',
      '¿Estás seguro que deseas finalizar la sesión antes de tiempo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: () => setPhase('SUMMARY'),
        },
      ],
    );
  };

  const handleSaveSession = () => {
    const log: SessionLog = {
      routineId,
      trainedAt: new Date().toISOString(),
      totalTime: formatTimeSpan(globalTime),
      exercises: logs,
    };
    onFinishSession?.(log);
  };

  /* ── guards ── */
  if (!currentExercise && phase !== 'SUMMARY') return null;

  /* ══════════════════════ COUNTDOWN ══════════════════════ */
  if (phase === 'COUNTDOWN') {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <Animated.Text
          key={countdown}
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
          className="text-lime-300 text-8xl font-black"
        >
          {countdown > 0 ? countdown : '¡Vamos!'}
        </Animated.Text>
      </View>
    );
  }

  /* ══════════════════════ SUMMARY ══════════════════════ */
  if (phase === 'SUMMARY') {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center p-6">
        <Ionicons name="trophy" size={80} color="#d9f99d" />
        <Text className="text-white text-3xl font-bold mb-2 mt-6">
          ¡Entrenamiento terminado!
        </Text>
        <Text className="text-zinc-400 text-lg mb-10">
          Tiempo total: {formatTime(globalTime)}
        </Text>

        <TouchableOpacity
          className="bg-lime-300 w-full p-4 rounded-xl items-center"
          onPress={handleSaveSession}
        >
          <Text className="text-black font-bold text-lg">Guardar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ══════════════════════ EXERCISE / REST ══════════════════════ */
  return (
    <View className="flex-1 bg-zinc-950 p-4 pt-14">
      <Text className="text-white text-xl font-bold text-center mb-6">
        Entrenamiento
      </Text>

      <View className="flex-1 justify-between">
        {/* ──── zona superior ──── */}
        <View className="w-full mb-4">
          {phase === 'EXERCISE' ? (
            <Animated.View
              key={`ex-${exerciseIndex}-${currentSet}`}
              entering={SlideInDown.duration(400)}
              exiting={SlideOutUp.duration(300)}
              className="items-center w-full"
            >
              {/* GIF del ejercicio */}
              <View className="bg-zinc-900 rounded-3xl overflow-hidden w-full aspect-square mb-4 items-center justify-center relative">
                {currentExercise.gifUrl ? (
                  <ExerciseGif uri={currentExercise.gifUrl} />
                ) : (
                  <Ionicons name="image-outline" size={60} color="#555" />
                )}

                {/* Botón flotante de información */}
                <TouchableOpacity
                  onPress={() => setShowInstructions(true)}
                  className="absolute top-4 right-4 bg-zinc-800/80 p-2 rounded-full z-10 border border-white/10"
                >
                  <Ionicons name="information-circle-outline" size={24} color="#d9f99d" />
                </TouchableOpacity>
              </View>

              {/* Chips de estadísticas */}
              <View className="bg-zinc-900 rounded-2xl py-4 px-2 w-full flex-row justify-between border border-zinc-800">
                <View className="items-center flex-1">
                  <Text className="text-lime-300 font-bold text-lg">
                    {currentSet}/{totalSets}
                  </Text>
                  <Text className="text-zinc-400 text-xs">Series</Text>
                </View>
                <View className="w-px bg-zinc-800" />
                <View className="items-center flex-1">
                  <Text className="text-lime-300 font-bold text-lg">
                    {formatReps(currentExercise)}
                  </Text>
                  <Text className="text-zinc-400 text-xs">Repeticiones</Text>
                </View>
                <View className="w-px bg-zinc-800" />
                <View className="items-center flex-1">
                  <Text className="text-lime-300 font-bold text-lg">
                    {currentExercise.rest}s
                  </Text>
                  <Text className="text-zinc-400 text-xs">Descanso</Text>
                </View>
                <View className="w-px bg-zinc-800" />
                <View className="items-center flex-1">
                  <Text className="text-lime-300 font-bold text-lg">
                    {currentExercise.weight}
                  </Text>
                  <Text className="text-zinc-400 text-xs">Peso</Text>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              key="rest-view"
              entering={SlideInUp.duration(400)}
              exiting={SlideOutDown.duration(300)}
              className="items-center w-full"
            >
              {/* Reloj grande de descanso */}
              <ClockCircle
                isRestPhase
                restTimeLeft={restTimeLeft}
                initialRest={initialRest}
                globalTime={globalTime}
              />

              {/* Slider de RPE */}
              <View className="w-full mt-8">
                <Text className="text-white font-bold text-lg ml-2 mb-2">
                  Esfuerzo percibido
                </Text>
                <View className="bg-zinc-900 rounded-2xl border border-zinc-800 pb-2">
                  <RPESlider value={rpe} onValueChange={setRpe} disabled={rpeSaved || isAdjustingLoad} />
                </View>

                <TouchableOpacity
                  className={`w-full p-4 rounded-xl items-center mt-4 ${rpeSaved ? 'bg-zinc-700' : 'bg-lime-300'
                    }`}
                  disabled={rpeSaved || isAdjustingLoad}
                  onPress={handleSaveRpe}
                >
                  {isAdjustingLoad ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text className={`font-bold text-base ${rpeSaved ? 'text-zinc-500' : 'text-black'}`}>
                      {rpe >= 4 && rpe <= 6
                        ? 'Guardar RPE'
                        : 'Guardar y actualizar serie'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>

        {/* ──── acciones inferiores ──── */}
        <View className="w-full flex-1 justify-end">
          {phase === 'EXERCISE' ? (
            /* Fase de ejercicio: reloj + botón Finalizar Serie */
            <View className="flex-row items-center justify-between mb-4 flex-1">
              <View className="flex-1 items-center justify-center">
                <ClockCircle
                  isRestPhase={false}
                  restTimeLeft={0}
                  initialRest={0}
                  globalTime={globalTime}
                  sizeOverride={dynamicClockSize}
                  isExerciseCountdown={isTimeBased}
                  exerciseTimeLeft={exerciseTimeLeft !== null ? exerciseTimeLeft : undefined}
                  exerciseInitialTime={timeBasedDuration}
                />
              </View>
              <TouchableOpacity
                className="bg-lime-300 rounded-2xl w-1/2 h-[120px] justify-center items-center ml-4"
                onPress={handleFinishSet}
              >
                <Text className="text-black font-bold text-xl text-center">
                  {'Finalizar\nSerie'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Fase de descanso: botón Finalizar Descanso */
            <View className="flex-1 mb-4 mt-8 justify-center">
              <TouchableOpacity
                className="bg-lime-300 rounded-2xl w-full h-[120px] justify-center items-center"
                onPress={handleFinishRest}
              >
                <Text className="text-black font-bold text-xl text-center">
                  Finalizar Descanso
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            className="bg-red-500 w-full py-4 rounded-xl items-center"
            onPress={handleFinishSessionEarly}
          >
            <Text className="text-white font-bold text-lg">
              Finalizar sesión
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de instrucciones */}
      {currentExercise && (
        <InstructionsModal
          visible={showInstructions}
          onClose={() => setShowInstructions(false)}
          exerciseId={currentExercise.id}
          exerciseName={currentExercise.exercise}
        />
      )}
    </View>
  );
};

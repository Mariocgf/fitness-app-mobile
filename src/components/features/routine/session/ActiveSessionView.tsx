import { SessionSlider } from '@/src/components/common/SessionSlider';
import { ExerciseActionButtons } from '@/src/components/features/ExerciseActionButtons';
import { ExerciseTimerCard } from '@/src/components/features/ExerciseTimerCard';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { adjustExerciseLoad } from '@/src/services/exercise.service';
import { ExerciseLog, SessionDay, SessionExercise, SessionLog } from '@/src/types/session';
import { formatReps, formatTime, formatTimeSpan } from '@/src/utils/format.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseGif } from './ExerciseGif';
import { InstructionsModal } from './InstructionsModal';

type Phase = 'COUNTDOWN' | 'EXERCISE' | 'REST' | 'SUMMARY';
type RepetitionMode = 'partial' | 'all';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

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
  const [repetitionMode, setRepetitionMode] = useState<RepetitionMode>('partial');
  const [partialReps, setPartialReps] = useState(0);

  const currentExercise = exercises[exerciseIndex];
  const totalSets = parseInt(currentExercise?.sets) || 1;
  const initialRest = parseInt(currentExercise?.rest) || 60;

  const isTimeBased = currentExercise?.repType === 'Timed';
  const timeBasedDuration = isTimeBased ? parseInt(currentExercise?.durationSeconds || '0', 10) : 0;
  const repetitionMax = useMemo(() => {
    const current = parseInt(currentExercise?.currentRep || '0', 10);
    const max = parseInt(currentExercise?.maxRep || '0', 10);
    const min = parseInt(currentExercise?.minRep || '0', 10);
    return current || max || min || 0;
  }, [currentExercise?.currentRep, currentExercise?.maxRep, currentExercise?.minRep]);
  const nextExercise = currentSet < totalSets
    ? currentExercise
    : exercises[exerciseIndex + 1] || currentExercise;
  const canUpdateRpe = !rpeSaved && !isAdjustingLoad && (rpe < 4 || rpe > 6);

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
    if (phase !== 'REST') return;
    setRepetitionMode('partial');
    setPartialReps(Math.round(repetitionMax / 2));
  }, [phase, repetitionMax, exerciseIndex, currentSet]);

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
    if (!rpeSaved) saveCurrentLog(rpe);

    if (currentSet < totalSets) {
      setCurrentSet((s) => s + 1);
    } else {
      setExerciseIndex((i) => i + 1);
      setCurrentSet(1);
    }
    setRpeSaved(false);
    setRpe(5);
    setPhase('EXERCISE');
  }, [currentSet, totalSets, rpe, rpeSaved, saveCurrentLog]);

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

  /* ══════════════════════ EXERCISE ══════════════════════ */
  if (phase === 'EXERCISE') {
    return (
      <View className="flex-1 bg-slate-100 dark:bg-slate-950">
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Zona blanca: desde barra de estado hasta el timer */}
        <View
          style={{ paddingTop: insets.top }}
          className="bg-white dark:bg-slate-900 rounded-b-3xl overflow-hidden"
        >
          {/* Header: < | nombre del ejercicio | (i) */}
          <View className="flex-row items-center px-4 pt-3 pb-3 gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color={isDark ? '#f1f5f9' : '#334155'} />
            </TouchableOpacity>
            <Text
              className="flex-1 text-center text-slate-900 dark:text-slate-50 font-semibold text-base"
              numberOfLines={2}
            >
              {currentExercise.name}
            </Text>
            <TouchableOpacity
              onPress={() => setShowInstructions(true)}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 items-center justify-center"
            >
              <Ionicons name="information-circle-outline" size={20} color={isDark ? '#f1f5f9' : '#334155'} />
            </TouchableOpacity>
          </View>

          {/* GIF cuadrado */}
          <View className="w-full aspect-square">
            {currentExercise.gifUrl ? (
              <ExerciseGif uri={currentExercise.gifUrl} />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="image-outline" size={60} color="#94a3b8" />
              </View>
            )}
          </View>

          {/* Timer + barra de progreso — key fuerza remount en cada serie/ejercicio */}
          <ExerciseTimerCard
            key={`timer-${exerciseIndex}-${currentSet}`}
            mode={isTimeBased ? 'countdown' : 'stopwatch'}
            time={isTimeBased ? (exerciseTimeLeft ?? 0) : globalTime}
            totalDuration={isTimeBased ? timeBasedDuration : undefined}
            remainingLabel={
              isTimeBased && exerciseTimeLeft !== null
                ? formatTime(exerciseTimeLeft)
                : undefined
            }
          />
        </View>

        {/* Zona gris: chips + botones de acción */}
        <View className="flex-1 px-4 pt-4 pb-6 gap-4">
          {/* Chips: Series | Repeticiones | Peso | Descanso */}
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
              <Text className="text-lime-400 text-lg font-bold text-center">
                {currentExercise.weight}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">Descanso</Text>
              <Text className="text-lime-400 text-lg font-bold text-center">
                {currentExercise.rest}s
              </Text>
            </View>
          </View>

          {/* Tres botones de acción — flex-1 para ocupar el espacio restante */}
          <View className="flex-1">
            <ExerciseActionButtons
              onEdit={() => console.log('edit')}
              onFlag={handleFinishSessionEarly}
              onNext={handleFinishSet}
            />
          </View>
        </View>

        {/* Modal de instrucciones */}
        {currentExercise && (
          <InstructionsModal
            visible={showInstructions}
            onClose={() => setShowInstructions(false)}
            exerciseId={currentExercise.exerciseId}
            exerciseName={currentExercise.name}
          />
        )}
      </View>
    );
  }

  /* ══════════════════════ REST ══════════════════════ */
  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-slate-100 dark:bg-slate-950"
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Animated.View
        entering={FadeIn.duration(250)}
        layout={LinearTransition.springify().damping(18)}
        className="flex-1 px-6 pb-8"
      >
        <View className="flex-row items-center justify-center pt-3 pb-5">
          <TouchableOpacity
            onPress={onCancel}
            className="absolute left-0 w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={28} color={isDark ? '#f1f5f9' : '#020617'} />
          </TouchableOpacity>
          <Text className="text-slate-900 dark:text-slate-50 text-base font-medium">
            Descanso
          </Text>
        </View>

        <Animated.View
          key={`rest-timer-${restTimeLeft}`}
          entering={FadeIn.duration(180)}
          className="items-center mb-7"
        >
          <Text className="text-slate-900 dark:text-slate-50 text-5xl font-black italic mb-4">
            {formatTime(restTimeLeft)}
          </Text>
          <View className="w-full flex-row items-center gap-3">
            <View
              className="h-3 rounded-full bg-slate-900 dark:bg-slate-50"
              style={{
                flex: initialRest > 0 ? Math.max((initialRest - restTimeLeft) / initialRest, 0.01) : 1,
              }}
            />
            <View
              className="h-3 rounded-full bg-slate-300 dark:bg-slate-700"
              style={{
                flex: initialRest > 0 ? Math.max(restTimeLeft / initialRest, 0.01) : 0.01,
              }}
            />
            <Text className="text-slate-900 dark:text-slate-50 text-lg w-14 text-right">
              {formatTime(globalTime)}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(250)}
          layout={LinearTransition.springify().damping(18)}
          className="mb-8"
        >
          <Text className="text-slate-900 dark:text-slate-50 font-bold text-xl mb-3">
            Esfuerzo percibido
          </Text>
          <SessionSlider
            value={rpe}
            onValueChange={setRpe}
            min={0}
            max={10}
            disabled={rpeSaved || isAdjustingLoad}
          />
          <TouchableOpacity
            className={`w-full h-12 rounded-full items-center justify-center mt-2 border ${
              canUpdateRpe
                ? 'bg-slate-900 dark:bg-slate-50 border-slate-900 dark:border-slate-50'
                : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
            }`}
            disabled={!canUpdateRpe}
            onPress={handleSaveRpe}
          >
            {isAdjustingLoad ? (
              <ActivityIndicator color={isDark ? '#020617' : '#ffffff'} size="small" />
            ) : (
              <Text
                className={`font-medium text-base ${
                  canUpdateRpe
                    ? 'text-white dark:text-slate-900'
                    : 'text-slate-900 dark:text-slate-50'
                }`}
              >
                Actualizar
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(250)}
          layout={LinearTransition.springify().damping(18)}
          className="bg-white dark:bg-slate-900 rounded-3xl -mx-6 px-6 pt-6 pb-4 mb-4"
        >
          <Text className="text-slate-900 dark:text-slate-50 font-bold text-xl mb-4">
            Repeticiones realizadas
          </Text>

          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity
              onPress={() => setRepetitionMode('partial')}
              className={`flex-1 h-12 rounded-full items-center justify-center ${
                repetitionMode === 'partial'
                  ? 'bg-black dark:bg-slate-50'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text
                className={`text-base ${
                  repetitionMode === 'partial'
                    ? 'text-white dark:text-slate-900'
                    : 'text-slate-900 dark:text-slate-50'
                }`}
              >
                Parcial
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRepetitionMode('all')}
              className={`flex-1 h-12 rounded-full items-center justify-center ${
                repetitionMode === 'all'
                  ? 'bg-black dark:bg-slate-50'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text
                className={`text-base ${
                  repetitionMode === 'all'
                    ? 'text-white dark:text-slate-900'
                    : 'text-slate-900 dark:text-slate-50'
                }`}
              >
                Todas
              </Text>
            </TouchableOpacity>
          </View>

          {repetitionMode === 'partial' ? (
            <Animated.View
              entering={FadeInDown.duration(220)}
              exiting={FadeOutUp.duration(180)}
              layout={LinearTransition.springify().damping(18)}
            >
              <SessionSlider
                value={partialReps}
                onValueChange={setPartialReps}
                min={0}
                max={repetitionMax}
              />
              <TouchableOpacity className="w-full h-12 rounded-full items-center justify-center mt-2 bg-black dark:bg-slate-50">
                <Text className="text-white dark:text-slate-900 font-medium text-base">
                  Actualizar
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(250)}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 flex-row items-center gap-4 mb-3"
        >
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
            <Text className="text-slate-900 dark:text-slate-50 text-lg font-semibold">
              Proximo ejercicio
            </Text>
            <Text className="text-slate-900 dark:text-slate-50 text-sm" numberOfLines={2}>
              {nextExercise?.name}
            </Text>
          </View>
        </Animated.View>

        <View className="flex-row gap-3 mt-auto">
          <TouchableOpacity
            className="flex-1 h-[88px] rounded-3xl bg-red-500 items-center justify-center"
            onPress={handleFinishSessionEarly}
          >
            <Ionicons name="flag" size={42} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 h-[88px] rounded-3xl bg-lime-400 items-center justify-center"
            onPress={handleFinishRest}
          >
            <Ionicons name="arrow-forward" size={54} color="black" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Modal de instrucciones */}
      {currentExercise && (
        <InstructionsModal
          visible={showInstructions}
          onClose={() => setShowInstructions(false)}
          exerciseId={currentExercise.exerciseId}
          exerciseName={currentExercise.name}
        />
      )}
    </View>
  );
};

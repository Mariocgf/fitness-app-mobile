import { adjustExerciseLoad } from '@/src/services/exercise.service';
import { ExerciseLog, SessionDay, SessionExercise, SessionLog } from '@/src/types/session';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export type Phase = 'COUNTDOWN' | 'EXERCISE' | 'REST' | 'SUMMARY';
export type RepetitionMode = 'partial' | 'all';

interface UseActiveSessionProps {
  routineId: string;
  day: SessionDay;
  onFinishSession?: (log: SessionLog) => void;
  onCancel?: () => void;
}

interface UseActiveSessionReturn {
  /* Estado de fase */
  phase: Phase;
  setPhase: (phase: Phase) => void;
  countdown: number;

  /* Estado de ejercicio */
  exercises: SessionExercise[];
  setExercises: (exercises: SessionExercise[] | ((prev: SessionExercise[]) => SessionExercise[])) => void;
  exerciseIndex: number;
  currentSet: number;
  currentExercise: SessionExercise;
  totalSets: number;
  nextExercise: SessionExercise;

  /* Timers */
  globalTime: number;
  restTimeLeft: number;
  exerciseTimeLeft: number | null;
  initialRest: number;

  /* RPE */
  rpe: number;
  setRpe: (rpe: number) => void;
  rpeSaved: boolean;
  isAdjustingLoad: boolean;
  canUpdateRpe: boolean;

  /* Repeticiones */
  repetitionMode: RepetitionMode;
  setRepetitionMode: (mode: RepetitionMode) => void;
  partialReps: number;
  setPartialReps: (reps: number) => void;
  repetitionMax: number;

  /* Flags */
  isTimeBased: boolean;
  timeBasedDuration: number;
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  logs: ExerciseLog[];

  /* Resumen de sesión */
  summaryStats: {
    exercisesDone: number;
    exercisesTotal: number;
    setsDone: number;
    setsTotal: number;
    repsDone: number;
    repsTotal: number;
    avgRpe: number;
  };

  /* Refs para animaciones */
  whiteBoxHeightRef: React.MutableRefObject<number>;
  exerciseBlockY: { value: number };
  restBlockY: { value: number };

  /* Handlers */
  handleFinishSet: () => void;
  handleFinishRest: () => void;
  handleSaveRpe: () => Promise<void>;
  handleFinishSessionEarly: () => void;
  handleSaveSession: () => void;
}

export function useActiveSession({
  routineId,
  day,
  onFinishSession,
}: UseActiveSessionProps): UseActiveSessionReturn {
  const { getToken } = useAuth();

  /* ── Estados ── */
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

  /* ── Computed values ── */
  const currentExercise = exercises[exerciseIndex];
  const totalSets = parseInt(currentExercise?.sets) || 1;
  const initialRest = parseInt(currentExercise?.rest) || 60;
  const isTimeBased = currentExercise?.repType === 'Timed';
  const timeBasedDuration = isTimeBased
    ? parseInt(currentExercise?.durationSeconds || '0', 10)
    : 0;

  const repetitionMax = useMemo(() => {
    const current = parseInt(currentExercise?.currentRep || '0', 10);
    const max = parseInt(currentExercise?.maxRep || '0', 10);
    const min = parseInt(currentExercise?.minRep || '0', 10);
    return current || max || min || 0;
  }, [currentExercise?.currentRep, currentExercise?.maxRep, currentExercise?.minRep]);

  const nextExercise = useMemo(
    () =>
      currentSet < totalSets
        ? currentExercise
        : exercises[exerciseIndex + 1] || currentExercise,
    [currentSet, totalSets, currentExercise, exercises, exerciseIndex]
  );

  const canUpdateRpe = !rpeSaved && !isAdjustingLoad && (rpe < 4 || rpe > 6);

  const summaryStats = useMemo(() => {
    const exercisesTotal = day.exercises.length;
    const exercisesDone = logs.length;
    const setsTotal = day.exercises.reduce((acc, ex) => acc + (parseInt(ex.sets) || 1), 0);
    const setsDone = setsTotal;
    const repsTotal = day.exercises.reduce((acc, ex) => {
      const rep = parseInt(ex.currentRep || ex.maxRep || ex.minRep || '0', 10);
      const sets = parseInt(ex.sets) || 1;
      return acc + rep * sets;
    }, 0);
    const repsDone = repsTotal;
    const avgRpe = logs.length > 0
      ? Math.round(logs.reduce((acc, l) => acc + l.rpe, 0) / logs.length)
      : 0;
    return { exercisesDone, exercisesTotal, setsDone, setsTotal, repsDone, repsTotal, avgRpe };
  }, [logs, day.exercises]);

  /* ── Refs para animaciones ── */
  const whiteBoxHeightRef = useRef(0);
  const exerciseBlockY = useSharedValue(0);
  const restBlockY = useSharedValue(600);

  /* ── Effects ── */

  /* Countdown inicial */
  useEffect(() => {
    if (phase !== 'COUNTDOWN') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase('EXERCISE'), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase]);

  /* Timer global */
  useEffect(() => {
    if (phase !== 'EXERCISE' && phase !== 'REST') return;
    const t = setInterval(() => setGlobalTime((g) => g + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  /* Timer de descanso */
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

  /* Auto-avance cuando descanso llega a 0 */
  useEffect(() => {
    if (phase === 'REST' && restTimeLeft === 0 && initialRest > 0) {
      const t = setTimeout(() => advanceAfterRest(), 500);
      return () => clearTimeout(t);
    }
  }, [phase, restTimeLeft]);

  /* Setup timer ejercicio timed */
  useEffect(() => {
    if (phase === 'EXERCISE' && isTimeBased) {
      setExerciseTimeLeft(timeBasedDuration);
    } else {
      setExerciseTimeLeft(null);
    }
  }, [phase, isTimeBased, timeBasedDuration, exerciseIndex, currentSet]);

  /* Reset repeticiones al entrar en descanso */
  useEffect(() => {
    if (phase !== 'REST') return;
    setRepetitionMode('partial');
    setPartialReps(Math.round(repetitionMax / 2));
  }, [phase, repetitionMax, exerciseIndex, currentSet]);

  /* Animaciones de transición entre fases */
  useEffect(() => {
    const h = whiteBoxHeightRef.current || 600;
    if (phase === 'REST') {
      exerciseBlockY.value = withTiming(-h, { duration: 400 });
      restBlockY.value = withTiming(0, { duration: 400 });
    } else if (phase === 'EXERCISE') {
      exerciseBlockY.value = withTiming(0, { duration: 400 });
      restBlockY.value = withTiming(h, { duration: 400 });
    }
  }, [phase]);

  /* Timer countdown ejercicio timed */
  useEffect(() => {
    if (phase !== 'EXERCISE' || !isTimeBased || exerciseTimeLeft === null || exerciseTimeLeft <= 0)
      return;
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

  /* Auto-finalizar ejercicio timed */
  useEffect(() => {
    if (phase === 'EXERCISE' && isTimeBased && exerciseTimeLeft === 0) {
      handleFinishSet();
    }
  }, [phase, isTimeBased, exerciseTimeLeft]);

  /* ── Handlers ── */

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
    [currentExercise?.id]
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

    setRestTimeLeft(initialRest);
    setRpe(5);
    setRpeSaved(false);
    setPhase('REST');
  }, [currentSet, totalSets, exerciseIndex, day.exercises.length, saveCurrentLog, initialRest]);

  const handleFinishRest = useCallback(() => {
    advanceAfterRest();
  }, [advanceAfterRest]);

  const handleSaveRpe = useCallback(async () => {
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
        Alert.alert('Aviso', 'No se pudo ajustar la carga para este ejercicio.');
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
      Alert.alert('Error', 'No se pudo ajustar la carga. Intente nuevamente.');
      console.log('STATUS:', error?.response?.status);
      console.log('DATA:', error?.response?.data);
      console.log('MESSAGE:', error?.message);
    } finally {
      setIsAdjustingLoad(false);
    }
  }, [rpe, currentExercise.id, day.id, getToken, exerciseIndex, saveCurrentLog]);

  const handleFinishSessionEarly = useCallback(() => {
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
      ]
    );
  }, []);

  const handleSaveSession = useCallback(() => {
    const totalMinutes = Math.floor(globalTime / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const log: SessionLog = {
      routineId,
      trainedAt: new Date().toISOString(),
      totalTime: formattedTime,
      exercises: logs,
    };
    onFinishSession?.(log);
  }, [globalTime, logs, routineId, onFinishSession]);

  return {
    phase,
    setPhase,
    countdown,
    exercises,
    setExercises,
    exerciseIndex,
    currentSet,
    currentExercise,
    totalSets,
    nextExercise,
    globalTime,
    restTimeLeft,
    exerciseTimeLeft,
    initialRest,
    rpe,
    setRpe,
    rpeSaved,
    isAdjustingLoad,
    canUpdateRpe,
    repetitionMode,
    setRepetitionMode,
    partialReps,
    setPartialReps,
    repetitionMax,
    isTimeBased,
    timeBasedDuration,
    showInstructions,
    setShowInstructions,
    logs,
    summaryStats,
    whiteBoxHeightRef,
    exerciseBlockY,
    restBlockY,
    handleFinishSet,
    handleFinishRest,
    handleSaveRpe,
    handleFinishSessionEarly,
    handleSaveSession,
  };
}

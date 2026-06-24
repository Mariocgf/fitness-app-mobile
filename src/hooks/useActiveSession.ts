import { adjustExerciseLoad } from '@/src/services/exercise.service';
import { ExerciseLog, SessionDay, SessionExercise, SessionExerciseEntry, SessionLog, SessionSet } from '@/src/types/session';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useSessionAudio } from './useSessionAudio';

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
  isLastExerciseAndSet: boolean;

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

  /* Handlers */
  handleFinishSet: () => void;
  handleFinishRest: () => void;
  handleSaveRpe: () => Promise<void>;
  handleFinishSessionEarly: () => void;
  handleSaveSession: () => void;
  handleIncompleteSet: () => void;
  handleSaveRepetitions: () => void;
  currentSetIncomplete: boolean;
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
  const [setsPerExercise, setSetsPerExercise] = useState<Map<string, SessionSet[]>>(new Map());
  const setsPerExerciseRef = useRef<Map<string, SessionSet[]>>(new Map());
  const [currentSetIncomplete, setCurrentSetIncomplete] = useState(false);

  /* ── Computed values ── */
  const currentExercise = exercises[exerciseIndex];
  const totalSets = parseInt(currentExercise?.sets) || 1;
  const initialRest = parseInt(currentExercise?.rest) || 60;
  const isTimeBased = currentExercise?.repType === 'Timed';
  const timeBasedDuration = isTimeBased
    ? parseInt(currentExercise?.durationSeconds || '0', 10)
    : 0;

  /* ── Audio de sesión ── */
  /* En REST el cronómetro activo es restTimeLeft; en EXERCISE timed es exerciseTimeLeft */
  useSessionAudio({
    timeLeft: phase === 'REST' ? restTimeLeft : (phase === 'EXERCISE' && isTimeBased ? exerciseTimeLeft : null),
    phase,
  });

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

  const isLastExerciseAndSet = useMemo(
    () => currentSet >= totalSets && exerciseIndex >= exercises.length - 1,
    [currentSet, totalSets, exerciseIndex, exercises.length]
  );

  const canUpdateRpe = !rpeSaved && !isAdjustingLoad && (rpe < 4 || rpe > 6);

  const summaryStats = useMemo(() => {
    const exercisesTotal = day.exercises.length;
    const exercisesDone = logs.length;
    const setsTotal = day.exercises.reduce((acc, ex) => acc + (parseInt(ex.sets) || 1), 0);
    const setsDone = logs.reduce((acc, l) => acc + l.sets.length, 0);
    const repsTotal = day.exercises.reduce((acc, ex) => {
      const rep = parseInt(ex.currentRep || ex.maxRep || ex.minRep || '0', 10);
      const sets = parseInt(ex.sets) || 1;
      return acc + rep * sets;
    }, 0);
    const repsDone = logs.reduce((acc, l) =>
      acc + l.sets.reduce((s, set) => s + set.repsPerformed, 0), 0
    );
    const avgRpe = logs.length > 0
      ? Math.round(logs.reduce((acc, l) => acc + l.rpe, 0) / logs.length)
      : 0;
    return { exercisesDone, exercisesTotal, setsDone, setsTotal, repsDone, repsTotal, avgRpe };
  }, [logs, day.exercises]);

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

  const recordCurrentSet = useCallback((isCompleted: boolean, reps: number): SessionSet[] => {
    const exerciseKey = currentExercise.id;
    const weight = currentExercise.loadType === 'ExternalWeight'
      ? Number(currentExercise.plannedWeightKg) || 0
      : 0;

    const repsPerformed = isTimeBased ? 0 : reps;

    const durationSeconds = isTimeBased
      ? timeBasedDuration - (exerciseTimeLeft ?? 0)
      : null;

    const newSet: SessionSet = {
      setNumber: currentSet,
      repsPerformed,
      weightUsed: weight,
      durationSeconds,
      isCompleted,
    };

    /* Leer del ref (siempre sincronizado) */
    const existing = setsPerExerciseRef.current.get(exerciseKey) ?? [];
    const updatedSets = [...existing, newSet];

    /* Actualizar ref síncronamente */
    const updatedMap = new Map(setsPerExerciseRef.current);
    updatedMap.set(exerciseKey, updatedSets);
    setsPerExerciseRef.current = updatedMap;

    /* Actualizar state para re-renders */
    setSetsPerExercise(updatedMap);

    return updatedSets;
  }, [
    currentExercise?.id,
    currentExercise?.loadType,
    currentExercise?.plannedWeightKg,
    currentSet,
    isTimeBased,
    timeBasedDuration,
    exerciseTimeLeft,
  ]);

  const handleSaveRepetitions = useCallback(() => {
    recordCurrentSet(false, partialReps); /* set incompleto */
    setCurrentSetIncomplete(false);
  }, [recordCurrentSet, partialReps]);

  const saveCurrentLog = useCallback(
    (finalRpe: number, overrideSets?: SessionSet[]) => {
      const exerciseKey = currentExercise.id;
      /* Leer del ref para evitar stale closures */
      const exerciseSets = overrideSets ?? setsPerExerciseRef.current.get(exerciseKey) ?? [];
      const totalWeight = exerciseSets.reduce((sum, s) => sum + s.weightUsed, 0);

      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.exerciseId === exerciseKey);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], rpe: finalRpe, totalWeight, sets: exerciseSets };
          return copy;
        }
        return [
          ...prev,
          { exerciseId: exerciseKey, rpe: finalRpe, totalWeight, sets: exerciseSets },
        ];
      });
    },
    [currentExercise?.id]
  );

  const advanceAfterRest = useCallback(() => {
    /* Si hay un set incompleto pendiente sin guardar, guardarlo ahora */
    if (currentSetIncomplete) {
      recordCurrentSet(false, partialReps);
      setCurrentSetIncomplete(false);
    }

    if (!rpeSaved) saveCurrentLog(rpe);

    const isLastSet = currentSet >= totalSets;
    const isLastExercise = exerciseIndex >= day.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      setPhase('SUMMARY');
      return;
    }

    if (currentSet < totalSets) {
      setCurrentSet((s) => s + 1);
    } else {
      setExerciseIndex((i) => i + 1);
      setCurrentSet(1);
    }
    setRpeSaved(false);
    setRpe(5);
    setPhase('EXERCISE');
  }, [currentSet, totalSets, exerciseIndex, day.exercises.length, rpe, rpeSaved, saveCurrentLog, currentSetIncomplete, recordCurrentSet, partialReps]);

  const handleFinishSet = useCallback(() => {
    setRepetitionMode('all'); /* verde = ocultar slider en REST */
    const updatedSets = recordCurrentSet(true, repetitionMax); /* set completado con todas las reps */

    const isLastSet = currentSet >= totalSets;
    const isLastExercise = exerciseIndex >= day.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      saveCurrentLog(5, updatedSets);
      setPhase('SUMMARY');
      return;
    }

    /* Pre-guardar log en último set del ejercicio para evitar stale closure en advanceAfterRest */
    if (isLastSet) {
      saveCurrentLog(5, updatedSets);
    }

    setRestTimeLeft(initialRest);
    setRpe(5);
    setRpeSaved(false);
    setPhase('REST');
  }, [currentSet, totalSets, exerciseIndex, day.exercises.length, saveCurrentLog, initialRest, recordCurrentSet, setRepetitionMode, repetitionMax]);

  const handleIncompleteSet = useCallback(() => {
    /* Si es timed, comportamiento igual que verde (ya se captura duración automáticamente) */
    if (isTimeBased) {
      handleFinishSet();
      return;
    }

    /* Para ejercicios de reps: transicionar a REST con slider visible */
    setRepetitionMode('partial');
    setCurrentSetIncomplete(true);
    setPartialReps(Math.round(repetitionMax / 2));

    /* Siempre ir a REST para que el usuario pueda ajustar las reps parciales */
    setRestTimeLeft(initialRest);
    setRpe(5);
    setRpeSaved(false);
    setPhase('REST');
  }, [isTimeBased, handleFinishSet, setRepetitionMode, repetitionMax, currentSet, totalSets, exerciseIndex, day.exercises.length, setPartialReps]);

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

      if (!adjustment.loadType && adjustment.plannedWeightKg == null && !adjustment.currentRep && !adjustment.durationSeconds) {
        Alert.alert('Aviso', 'No se pudo ajustar la carga para este ejercicio.');
      } else {
        setExercises((prev) => {
          const newEx = [...prev];
          const curr = { ...newEx[exerciseIndex] };
          if (adjustment.loadType !== null) {
            curr.loadType = adjustment.loadType;
            curr.plannedWeightKg = adjustment.plannedWeightKg;
          }
          if (adjustment.currentRep !== null) curr.currentRep = String(adjustment.currentRep);
          if (adjustment.durationSeconds !== null) curr.durationSeconds = String(adjustment.durationSeconds);
          newEx[exerciseIndex] = curr;
          return newEx;
        });
        saveCurrentLog(rpe);
        setRpeSaved(true);
      }
    } catch {
      Alert.alert('Error', 'No se pudo ajustar la carga. Intente nuevamente.');
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
    const h = Math.floor(globalTime / 3600).toString().padStart(2, '0');
    const m = Math.floor((globalTime % 3600) / 60).toString().padStart(2, '0');
    const s = (globalTime % 60).toString().padStart(2, '0');
    const formattedTime = `${h}:${m}:${s}`;

    const flatExercises: SessionExerciseEntry[] = logs.flatMap((ex) =>
      ex.sets.map((set) => ({
        exerciseId: ex.exerciseId,
        rpe: ex.rpe,
        setNumber: set.setNumber,
        repsPerformed: set.repsPerformed,
        weightUsed: set.weightUsed,
        durationSeconds: set.durationSeconds,
        isCompleted: set.isCompleted,
      }))
    );

    const log: SessionLog = {
      routineId,
      trainedAt: new Date().toISOString(),
      totalTime: formattedTime,
      exercises: flatExercises,
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
    isLastExerciseAndSet,
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
    handleFinishSet,
    handleFinishRest,
    handleSaveRpe,
    handleFinishSessionEarly,
    handleSaveSession,
    handleIncompleteSet,
    handleSaveRepetitions,
    currentSetIncomplete,
  };
}

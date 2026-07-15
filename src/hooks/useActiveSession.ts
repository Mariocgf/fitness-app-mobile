import { AdjustLoadSet, adjustExerciseLoad } from '@/src/services/exercise.service';
import { ExerciseLog, SessionDay, SessionExercise, SessionExerciseEntry, SessionLog, SessionSet } from '@/src/types/session';
import { logger } from '@/src/utils/logger';
import { ExerciseLoadPatch, hasLoadChanges } from '@/src/utils/routine-adjust.utils';
import { averageRpe } from '@/src/utils/rpe';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { alertDialog, confirm, toast } from '@/src/components/ui/feedback';
import { useNetworkStatus } from './useNetworkStatus';
import { useSessionAudio } from './useSessionAudio';

export type Phase = 'EXERCISE' | 'REST' | 'SUMMARY';
export type RepetitionMode = 'partial' | 'all';

interface UseActiveSessionProps {
  routineId: string;
  day: SessionDay;
  onFinishSession?: (log: SessionLog) => void;
  onCancel?: () => void;
  /**
   * Avisa que el backend ajustó la carga de un ejercicio, para que el consumidor
   * propague el cambio a la rutina cacheada (la sesión trabaja sobre un snapshot del
   * día: sin esto, al salir el detalle mostraría el peso viejo).
   *
   * `exerciseEntryId` es el `id` del ejercicio DENTRO del día, no el de catálogo.
   */
  onExerciseAdjusted?: (exerciseEntryId: string, patch: ExerciseLoadPatch) => void;
}

interface UseActiveSessionReturn {
  /* Estado de fase */
  phase: Phase;
  setPhase: (phase: Phase) => void;

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

  /* Esfuerzo percibido (por SET) */
  /** Esfuerzo de la serie que se está puntuando; `null` = el usuario no tocó nada. */
  currentSetRpe: number | null;
  setCurrentSetRpe: (value: number) => void;
  /** La última serie de la sesión no tiene descanso: el resumen le pregunta por ella. */
  isSummaryRpePending: boolean;

  /* Ajuste de carga (acción SEPARADA de registrar el esfuerzo) */
  canAdjustLoad: boolean;
  isAdjustingLoad: boolean;
  handleAdjustLoad: () => Promise<void>;

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
    /** `null` cuando no se registró ni un esfuerzo: no se muestra un 0 inventado. */
    avgRpe: number | null;
  };

  /* Handlers */
  handleFinishSet: () => void;
  handleFinishRest: () => void;
  handleFinishSessionEarly: () => void;
  handleSaveSession: () => void;
  handleIncompleteSet: () => void;
}

export function useActiveSession({
  routineId,
  day,
  onFinishSession,
  onExerciseAdjusted,
}: UseActiveSessionProps): UseActiveSessionReturn {
  const { getToken } = useAuth();
  const { isOnline } = useNetworkStatus();

  /* Ref estable: el consumidor puede pasar una arrow nueva en cada render sin que eso
     invalide `handleAdjustLoad` (lección del repo: callbacks inestables en deps). */
  const onExerciseAdjustedRef = useRef(onExerciseAdjusted);
  onExerciseAdjustedRef.current = onExerciseAdjusted;


  /* ── Estados ── */
  const [phase, setPhase] = useState<Phase>('EXERCISE');
  const [exercises, setExercises] = useState<SessionExercise[]>(day.exercises);
  const [globalTime, setGlobalTime] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState<number | null>(null);
  const [isAdjustingLoad, setIsAdjustingLoad] = useState(false);
  const [repetitionMode, setRepetitionMode] = useState<RepetitionMode>('partial');
  const [partialReps, setPartialRepsState] = useState(0);
  const [isSummaryRpePending, setIsSummaryRpePending] = useState(false);

  /* Series ejecutadas por ejercicio: única fuente de verdad de la sesión. */
  const [setsPerExercise, setSetsPerExercise] = useState<Map<string, SessionSet[]>>(new Map());
  const setsPerExerciseRef = useRef<Map<string, SessionSet[]>>(new Map());

  /**
   * Cuántas series llevaba cada ejercicio en su último ajuste de carga.
   * Es lo que hace cumplir la regla "cada ajuste exige un set nuevo que lo respalde":
   * solo cuentan las series posteriores a esta marca.
   */
  const [adjustBaseline, setAdjustBaseline] = useState<Map<string, number>>(new Map());
  const adjustBaselineRef = useRef<Map<string, number>>(new Map());

  /* ── Computed values ── */
  const currentExercise = exercises[exerciseIndex];
  const currentExerciseKey = currentExercise?.id ?? '';
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

  /* Series ya ejecutadas del ejercicio en curso. */
  const currentSets = useMemo(
    () => setsPerExercise.get(currentExerciseKey) ?? [],
    [setsPerExercise, currentExerciseKey]
  );

  /* La serie que se está puntuando es siempre la última registrada. */
  const currentSetRpe = currentSets.length > 0 ? currentSets[currentSets.length - 1].rpe : null;

  /**
   * Series que se mandan como evidencia a `adjust-load`: las ejecutadas CON LA CARGA
   * VIGENTE (o sea, desde el último ajuste) que tengan esfuerzo registrado.
   *
   * Las anteriores al último ajuste se hicieron con OTRA carga: mezclarlas sería
   * comparar peras con manzanas. Las que no tienen esfuerzo no son evidencia de nada.
   */
  const setsForAdjust = useMemo(() => {
    const baseline = adjustBaseline.get(currentExerciseKey) ?? 0;
    return currentSets.slice(baseline).filter((set) => set.rpe !== null);
  }, [currentSets, adjustBaseline, currentExerciseKey]);

  /**
   * Sin ninguna serie con esfuerzo desde el último ajuste no hay nada que mandar: el
   * botón queda deshabilitado. No se inventa un esfuerzo para poder ajustar.
   */
  const canAdjustLoad = isOnline && !isAdjustingLoad && setsForAdjust.length > 0;

  /**
   * Los logs se DERIVAN de las series registradas: no hay un segundo estado que
   * mantener sincronizado (y por lo tanto no hay forma de que se desincronice al
   * puntuar una serie después de haberla guardado).
   *
   * ⚠️ NO "unificar" este id con el de `adjust-load`. Los dos endpoints esperan
   * identificadores DISTINTOS, y está verificado contra el backend real:
   * - `POST /api/Routine/sessions` → `exercise.id` (la clave del día de rutina). ESTE.
   * - `POST /api/Exercise/adjust-load` → `exercise.exerciseId` (el id de catálogo).
   *
   * Parece una inconsistencia y no lo es. Cambiar este `id` por `exerciseId` "por
   * coherencia" rompe el guardado de la sesión, que hoy funciona.
   */
  const logs = useMemo<ExerciseLog[]>(
    () =>
      exercises
        .map((exercise) => {
          const sets = setsPerExercise.get(exercise.id) ?? [];
          if (sets.length === 0) return null;
          return {
            exerciseId: exercise.id,
            totalWeight: sets.reduce((sum, set) => sum + set.weightUsed, 0),
            sets,
          };
        })
        .filter((log): log is ExerciseLog => log !== null),
    [exercises, setsPerExercise]
  );

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
    /* Promedia solo las series con dato: las omitidas no puntúan ni penalizan. */
    const avgRpe = averageRpe(logs.flatMap((l) => l.sets.map((set) => set.rpe)));
    return { exercisesDone, exercisesTotal, setsDone, setsTotal, repsDone, repsTotal, avgRpe };
  }, [logs, day.exercises]);

  /* ── Effects ── */

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

  /* ── Escritura de series (ref + state en paralelo para evitar stale closures) ── */

  const commitSets = useCallback((exerciseKey: string, sets: SessionSet[]) => {
    const updatedMap = new Map(setsPerExerciseRef.current);
    updatedMap.set(exerciseKey, sets);
    setsPerExerciseRef.current = updatedMap;
    setSetsPerExercise(updatedMap);
  }, []);

  /**
   * Registra la serie en curso. El esfuerzo arranca SIEMPRE en `null`: el usuario lo
   * elige después, durante el descanso. Si no lo elige, queda en `null` — eso ya es
   * omitir, y no hace falta un botón para no decir nada.
   */
  const recordCurrentSet = useCallback((isCompleted: boolean, reps: number): SessionSet[] => {
    const exerciseKey = currentExercise.id;
    const weight = currentExercise.loadType === 'ExternalWeight'
      ? Number(currentExercise.plannedWeightKg) || 0
      : 0;

    const newSet: SessionSet = {
      setNumber: currentSet,
      repsPerformed: isTimeBased ? 0 : reps,
      weightUsed: weight,
      durationSeconds: isTimeBased ? timeBasedDuration - (exerciseTimeLeft ?? 0) : null,
      rpe: null,
      isCompleted,
    };

    const updatedSets = [...(setsPerExerciseRef.current.get(exerciseKey) ?? []), newSet];
    commitSets(exerciseKey, updatedSets);
    return updatedSets;
  }, [
    currentExercise?.id,
    currentExercise?.loadType,
    currentExercise?.plannedWeightKg,
    currentSet,
    isTimeBased,
    timeBasedDuration,
    exerciseTimeLeft,
    commitSets,
  ]);

  /** Aplica un patch a la última serie registrada del ejercicio en curso. */
  const patchLastSet = useCallback((patch: Partial<SessionSet>) => {
    const exerciseKey = currentExercise?.id;
    if (!exerciseKey) return;
    const sets = setsPerExerciseRef.current.get(exerciseKey) ?? [];
    if (sets.length === 0) return;

    commitSets(
      exerciseKey,
      sets.map((set, i) => (i === sets.length - 1 ? { ...set, ...patch } : set)),
    );
  }, [currentExercise?.id, commitSets]);

  /** Registra el esfuerzo de la serie en curso. NO ajusta la carga: son dos acciones. */
  const setCurrentSetRpe = useCallback((value: number) => {
    patchLastSet({ rpe: value });
  }, [patchLastSet]);

  /** Las reps parciales editan la serie ya registrada (no crean una nueva). */
  const setPartialReps = useCallback((reps: number) => {
    setPartialRepsState(reps);
    patchLastSet({ repsPerformed: reps });
  }, [patchLastSet]);

  /* ── Handlers de flujo ── */

  const advanceAfterRest = useCallback(() => {
    const isLastSet = currentSet >= totalSets;
    const isLastExercise = exerciseIndex >= day.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      /* Ya tuvo su descanso para puntuar: el resumen no vuelve a preguntar. */
      setPhase('SUMMARY');
      return;
    }

    if (currentSet < totalSets) {
      setCurrentSet((s) => s + 1);
    } else {
      setExerciseIndex((i) => i + 1);
      setCurrentSet(1);
    }
    setPhase('EXERCISE');
  }, [currentSet, totalSets, exerciseIndex, day.exercises.length]);

  const handleFinishSet = useCallback(() => {
    setRepetitionMode('all'); /* verde = ocultar slider de reps en REST */
    recordCurrentSet(true, repetitionMax);

    const isLastSet = currentSet >= totalSets;
    const isLastExercise = exerciseIndex >= day.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      /* La última serie no tiene descanso: si no preguntáramos acá, el usuario nunca
         llegaría a ver el selector y ese `null` sería nuestro, no suyo. */
      setIsSummaryRpePending(true);
      setPhase('SUMMARY');
      return;
    }

    setRestTimeLeft(initialRest);
    setPhase('REST');
  }, [currentSet, totalSets, exerciseIndex, day.exercises.length, initialRest, recordCurrentSet, repetitionMax]);

  const handleIncompleteSet = useCallback(() => {
    /* Si es timed, comportamiento igual que verde (la duración ya se captura sola) */
    if (isTimeBased) {
      handleFinishSet();
      return;
    }

    /* Para ejercicios de reps: se registra la serie YA (con las reps a mitad de camino)
       para poder puntuarla durante el descanso; el slider la va corrigiendo. */
    const initialPartialReps = Math.round(repetitionMax / 2);
    setRepetitionMode('partial');
    setPartialRepsState(initialPartialReps);
    recordCurrentSet(false, initialPartialReps);

    setRestTimeLeft(initialRest);
    setPhase('REST');
  }, [isTimeBased, handleFinishSet, repetitionMax, initialRest, recordCurrentSet]);

  const handleFinishRest = useCallback(() => {
    advanceAfterRest();
  }, [advanceAfterRest]);

  /**
   * Ajuste de carga: SIEMPRE nace de un tap explícito del usuario, nunca como efecto
   * secundario de registrar un esfuerzo.
   *
   * Dos usuarios pueden marcar "Al fallo" con intenciones opuestas: uno lo busca
   * (hipertrofia) y el otro lo sufre. El RPE no los distingue — solo este tap.
   */
  const handleAdjustLoad = useCallback(async () => {
    if (!isOnline) {
      toast.info(
        'El ajuste de carga necesita conexión. Podés completar la sesión y se guardará offline.',
        { title: 'Sin conexión' },
      );
      return;
    }

    /* OJO, `SessionExercise` tiene DOS ids y NO son intercambiables. Cada endpoint
       espera el suyo (verificado contra el backend real, no asumido):
       - `id`         → clave del ejercicio DENTRO del día de rutina. Es la clave local
                        (Map de series, línea base de ajustes) y la que espera
                        `POST /api/Routine/sessions`.
       - `exerciseId` → id del ejercicio en el CATÁLOGO. Es la que espera ESTE endpoint
                        (`adjust-load`). Mandarle el `id` del día era el motivo por el
                        que el ajuste de carga fallaba. */
    const exerciseKey = currentExercise.id;
    const sets = setsPerExerciseRef.current.get(exerciseKey) ?? [];
    const baseline = adjustBaselineRef.current.get(exerciseKey) ?? 0;

    /* El backend recibe las SERIES y hace él la agregación: solo las ejecutadas con la
       carga vigente y con esfuerzo registrado. Sin evidencia no hay ajuste, y no se
       fabrica un esfuerzo para poder llamar al endpoint. */
    const evidence: AdjustLoadSet[] = sets
      .slice(baseline)
      .filter((set): set is SessionSet & { rpe: number } => set.rpe !== null)
      .map((set) => ({
        repsPerformed: set.repsPerformed,
        rpe: set.rpe,
        durationSeconds: set.durationSeconds,
      }));

    if (evidence.length === 0) return;

    setIsAdjustingLoad(true);

    let decision: string | null = null;
    let hasChanges = false;

    try {
      const token = await getToken();
      /* Viaja el id de CATÁLOGO (`exerciseId`), no la clave local del día (`id`). */
      const adjustment = await adjustExerciseLoad(
        currentExercise.exerciseId,
        day.id,
        evidence,
        token,
      );

      decision = adjustment.decision;

      const patch: ExerciseLoadPatch = {
        loadType: adjustment.loadType,
        plannedWeightKg: adjustment.plannedWeightKg,
        currentRep: adjustment.currentRep,
        durationSeconds: adjustment.durationSeconds,
      };
      hasChanges = hasLoadChanges(patch);

      /* Cada campo se aplica POR SU CUENTA. Antes el peso era rehén del `loadType`
         (`if (loadType !== null) { loadType = ...; plannedWeightKg = ... }`), así que una
         respuesta con `loadType: null` y un peso nuevo — que es justo lo que devuelve el
         backend — descartaba el peso en silencio.

         Se pisa todo lo que venga no-nulo: peso, repeticiones y duración. `null` significa
         "no lo toqué", no "ponelo en cero". Las series siguientes ya usan los valores
         nuevos (`recordCurrentSet` y `repetitionMax` leen de acá). */
      if (hasChanges) {
        setExercises((prev) => {
          const newEx = [...prev];
          const curr = { ...newEx[exerciseIndex] };
          if (patch.loadType !== null) curr.loadType = patch.loadType;
          if (patch.plannedWeightKg !== null) curr.plannedWeightKg = patch.plannedWeightKg;
          if (patch.currentRep !== null) curr.currentRep = String(patch.currentRep);
          if (patch.durationSeconds !== null) curr.durationSeconds = String(patch.durationSeconds);
          newEx[exerciseIndex] = curr;
          return newEx;
        });

        /* La sesión trabaja sobre un snapshot del día: el consumidor propaga el ajuste
           a la rutina cacheada para que al salir no vuelva a aparecer el peso viejo. */
        onExerciseAdjustedRef.current?.(exerciseKey, patch);
      }

      /* El backend PISA la carga, así que los ajustes se acumulan: exigir una serie
         nueva entre ajustes impide bajar el peso 4 veces respondiendo a la MISMA
         observación. La línea base pasa a ser lo ya ejecutado, así el botón se
         deshabilita hasta la próxima serie con esfuerzo. */
      const updatedBaseline = new Map(adjustBaselineRef.current);
      updatedBaseline.set(exerciseKey, sets.length);
      adjustBaselineRef.current = updatedBaseline;
      setAdjustBaseline(updatedBaseline);
    } catch (error) {
      logger.error('[useActiveSession] adjust-load FAIL', error);
      toast.error('No se pudo ajustar la carga. Intente nuevamente.');
      return;
    } finally {
      setIsAdjustingLoad(false);
    }

    /* El feedback va DESPUÉS del `finally`: si el diálogo se abriera dentro del `try`,
       el spinner del botón seguiría girando detrás del modal hasta que lo cierres.

       La decisión la explica el backend; el front no la interpreta ni la reescribe.
       "Te bajé la carga" y "la dejo como está" son las dos respuestas válidas. */
    if (decision) {
      await alertDialog({
        title: 'Ajuste de carga',
        message: decision,
        confirmText: 'Entendido',
      });
    } else if (hasChanges) {
      toast.success('Carga ajustada para las próximas series.');
    } else {
      toast.info('No hizo falta ajustar la carga.', { title: 'Sin cambios' });
    }
  }, [isOnline, currentExercise?.id, currentExercise?.exerciseId, day.id, getToken, exerciseIndex]);

  const handleFinishSessionEarly = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Finalizar Sesión',
      message: '¿Estás seguro que deseas finalizar la sesión antes de tiempo?',
      confirmText: 'Finalizar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (confirmed) setPhase('SUMMARY');
  }, []);

  const handleSaveSession = useCallback(() => {
    const h = Math.floor(globalTime / 3600).toString().padStart(2, '0');
    const m = Math.floor((globalTime % 3600) / 60).toString().padStart(2, '0');
    const s = (globalTime % 60).toString().padStart(2, '0');
    const formattedTime = `${h}:${m}:${s}`;

    const flatExercises: SessionExerciseEntry[] = logs.flatMap((ex) =>
      ex.sets.map((set) => ({
        exerciseId: ex.exerciseId,
        /* El esfuerzo viaja tal cual lo registró (o no registró) el usuario. */
        rpe: set.rpe,
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
    currentSetRpe,
    setCurrentSetRpe,
    isSummaryRpePending,
    canAdjustLoad,
    isAdjustingLoad,
    handleAdjustLoad,
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
    handleFinishSessionEarly,
    handleSaveSession,
    handleIncompleteSet,
  };
}

import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ExerciseSearchItem } from '../services/exercise.service';
import { createManualTrainingSession } from '../services/training-history.service';
import { CreateManualSessionPayload } from '../types/training-history';

/** Set en edición dentro del form (con key estable para React). */
export interface DraftSet {
  key: string;
  reps: number;
  rpe: number;
  weight: number;
}

/** Ejercicio en edición dentro del form. */
export interface DraftExercise {
  key: string;
  exerciseId: string;
  name: string;
  gifUrl: string | null;
  sets: DraftSet[];
}

/** Crea un set por defecto (todo en 0; la filosofía del back es "sin campos obligatorios"). */
const makeDefaultSet = (key: string): DraftSet => ({ key, reps: 0, rpe: 0, weight: 0 });

export interface UseManualSessionFormReturn {
  trainedAt: Date;
  setTrainedAt: (d: Date) => void;
  durationHours: number;
  durationMinutes: number;
  setDurationHours: (h: number) => void;
  setDurationMinutes: (m: number) => void;
  exercises: DraftExercise[];
  selectedExerciseIds: string[];
  /** Key del ejercicio actualmente expandido (acordeón de una sola card abierta). */
  expandedKey: string | null;
  toggleExpanded: (key: string) => void;
  addExercise: (item: ExerciseSearchItem) => void;
  removeExercise: (key: string) => void;
  addSet: (exerciseKey: string) => void;
  removeSet: (exerciseKey: string, setKey: string) => void;
  updateSet: (exerciseKey: string, setKey: string, patch: Partial<Omit<DraftSet, 'key'>>) => void;
  isValid: boolean;
  isSaving: boolean;
  /** Registra la sesión; devuelve el id creado. Lanza en caso de error. */
  submit: () => Promise<string>;
}

/**
 * Estado y validación del formulario de registro de sesión manual.
 * Sigue las lecciones del repo: `getTokenRef` estable (no refetch por refresh de
 * Clerk), keys estables por contador, y `setNumber` implícito por posición del array.
 */
export function useManualSessionForm(): UseManualSessionFormReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const keyCounter = useRef(0);
  const nextKey = useCallback(() => {
    keyCounter.current += 1;
    return `k${keyCounter.current}`;
  }, []);

  const [trainedAt, setTrainedAt] = useState<Date>(() => new Date());
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // Acordeón: solo una card abierta a la vez.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Ref para leer la lista actual de forma síncrona (dedupe sin closures stale).
  const exercisesRef = useRef(exercises);
  exercisesRef.current = exercises;

  const toggleExpanded = useCallback((key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const addExercise = useCallback(
    (item: ExerciseSearchItem) => {
      // Evita duplicar un ejercicio ya agregado (además AddExerciseSheet ya lo excluye).
      if (exercisesRef.current.some((e) => e.exerciseId === item.exerciseId)) return;
      const key = nextKey();
      setExercises((prev) => [
        ...prev,
        {
          key,
          exerciseId: item.exerciseId,
          name: item.name,
          gifUrl: item.gifUrl ?? null,
          sets: [makeDefaultSet(nextKey())],
        },
      ]);
      // El nuevo aparece abierto y los demás se cierran (single-open).
      setExpandedKey(key);
    },
    [nextKey],
  );

  const removeExercise = useCallback((key: string) => {
    setExercises((prev) => prev.filter((e) => e.key !== key));
    setExpandedKey((prev) => (prev === key ? null : prev));
  }, []);

  const addSet = useCallback(
    (exerciseKey: string) => {
      setExercises((prev) =>
        prev.map((e) => {
          if (e.key !== exerciseKey) return e;
          // Replica los valores de la última serie (o defaults si no hubiera ninguna).
          const last = e.sets[e.sets.length - 1];
          const newSet: DraftSet = last
            ? { key: nextKey(), reps: last.reps, rpe: last.rpe, weight: last.weight }
            : makeDefaultSet(nextKey());
          return { ...e, sets: [...e.sets, newSet] };
        }),
      );
    },
    [nextKey],
  );

  const removeSet = useCallback((exerciseKey: string, setKey: string) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.key === exerciseKey ? { ...e, sets: e.sets.filter((s) => s.key !== setKey) } : e,
      ),
    );
  }, []);

  const updateSet = useCallback(
    (exerciseKey: string, setKey: string, patch: Partial<Omit<DraftSet, 'key'>>) => {
      setExercises((prev) =>
        prev.map((e) =>
          e.key === exerciseKey
            ? { ...e, sets: e.sets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)) }
            : e,
        ),
      );
    },
    [],
  );

  const selectedExerciseIds = useMemo(() => exercises.map((e) => e.exerciseId), [exercises]);

  // Reglas del contrato: al menos 1 ejercicio y cada uno con al menos 1 set.
  const isValid = useMemo(
    () => exercises.length > 0 && exercises.every((e) => e.sets.length > 0),
    [exercises],
  );

  const submit = useCallback(async (): Promise<string> => {
    if (!isValid) throw new Error('Agregá al menos un ejercicio con una serie.');

    const totalSeconds = durationHours * 3600 + durationMinutes * 60;

    const payload: CreateManualSessionPayload = {
      trainedAt,
      totalSeconds: totalSeconds > 0 ? totalSeconds : null,
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseNameSnapshot: e.name,
        sets: e.sets.map((s) => ({
          reps: s.reps,
          rpe: s.rpe,
          weight: s.weight,
          durationSeconds: null,
        })),
      })),
    };

    setIsSaving(true);
    try {
      const token = await getTokenRef.current();
      return await createManualTrainingSession(payload, token);
    } finally {
      setIsSaving(false);
    }
  }, [isValid, trainedAt, durationHours, durationMinutes, exercises]);

  return {
    trainedAt,
    setTrainedAt,
    durationHours,
    durationMinutes,
    setDurationHours,
    setDurationMinutes,
    exercises,
    selectedExerciseIds,
    expandedKey,
    toggleExpanded,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    isValid,
    isSaving,
    submit,
  };
}

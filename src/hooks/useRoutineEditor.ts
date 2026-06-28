/**
 * Estado y operaciones compartidas para crear/editar una rutina manual.
 * Encapsula los días, el día activo, el CRUD de ejercicios y el armado del
 * payload, para que CreateRoutineView y RoutineEditMode no dupliquen la lógica.
 * La diferencia entre ambos vive en sus wrappers (init y acción de guardado).
 */
import { ExerciseSearchItem } from '@/src/services/exercise.service';
import { CreateRoutinePayload } from '@/src/services/routine.service';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import {
  DAYS_MAP,
  buildRoutinePayload,
  generateId,
  sortDaysByWeek,
} from '@/src/utils/routine-editor.utils';
import React, { useCallback, useMemo, useRef, useState } from 'react';

/** Campo numérico editable de un ejercicio (los que llevan wheel picker simple) */
export type RoutineExerciseField = 'sets' | 'reps' | 'restSeconds';

export interface RoutineEditor {
  name: string;
  setName: (value: string) => void;
  days: CreateRoutineDay[];
  activeDayIndex: number;
  setActiveDayIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Días de la semana aún no agregados (para el slot "+ Día") */
  availableDays: { value: string; label: string }[];
  /** Día activo real (clamp a un día existente; null si la rutina no tiene días) */
  activeDay: CreateRoutineDay | null;
  /** Nombre con contenido + al menos un día con ejercicios */
  isValid: boolean;
  addDay: (value: string, label: string) => void;
  removeDay: (dayId: string) => void;
  copyDayExercises: (from: CreateRoutineDay, to: CreateRoutineDay) => void;
  updateExerciseField: (exId: string, field: RoutineExerciseField, value: string) => void;
  updateExerciseWeight: (exId: string, value: number | null) => void;
  toggleRepMode: (exId: string) => void;
  removeExercise: (exId: string) => void;
  reorderExercises: (newOrder: CreateRoutineExercise[]) => void;
  handleAddExercise: (item: ExerciseSearchItem) => void;
  replacingExerciseId: string | null;
  setReplacingExerciseId: (id: string | null) => void;
  handleReplaceExercise: (item: ExerciseSearchItem) => void;
  /** Arma el payload de la API (ignora días vacíos) */
  buildPayload: (activate: boolean) => CreateRoutinePayload;
}

interface UseRoutineEditorParams {
  initialName?: string;
  initialDays?: CreateRoutineDay[];
}

export function useRoutineEditor({ initialName, initialDays }: UseRoutineEditorParams = {}): RoutineEditor {
  const [name, setName] = useState(initialName ?? '');
  const [days, setDays] = useState<CreateRoutineDay[]>(() => sortDaysByWeek(initialDays ?? []));
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);

  const availableDays = useMemo(
    () => DAYS_MAP.filter((d) => !days.some((dd) => dd.value === d.value)),
    [days],
  );

  const clampedIndex = Math.min(activeDayIndex, Math.max(0, days.length - 1));
  const activeDay = days[clampedIndex] ?? null;

  // Ref para leer el día activo dentro de handlers estables (drag/add de ejercicios)
  // sin recrearlos en cada cambio de día → evita stale closures al reordenar.
  const activeDayIdRef = useRef<string | null>(null);
  activeDayIdRef.current = activeDay?.id ?? null;

  /* ── Días ─────────────────────────────────────────────────────────────── */

  const addDay = useCallback((value: string, label: string) => {
    setDays((prev) => {
      const next = sortDaysByWeek([...prev, { id: generateId(), value, label, exercises: [] }]);
      setActiveDayIndex(next.findIndex((d) => d.value === value));
      return next;
    });
  }, []);

  const removeDay = useCallback((dayId: string) => {
    setDays((prev) => prev.filter((d) => d.id !== dayId));
    setActiveDayIndex((i) => Math.max(0, i - 1));
  }, []);

  const copyDayExercises = useCallback((from: CreateRoutineDay, to: CreateRoutineDay) => {
    const copied = from.exercises.map((ex) => ({ ...ex, id: generateId() }));
    setDays((prev) => prev.map((d) => (d.id === to.id ? { ...d, exercises: copied } : d)));
  }, []);

  /* ── Ejercicios (por id, robustos al cambio de día) ───────────────────── */

  const updateExerciseField = useCallback(
    (exId: string, field: RoutineExerciseField, value: string) => {
      const num = parseInt(value, 10) || 0;
      setDays((prev) => prev.map((day) => ({
        ...day,
        exercises: day.exercises.map((ex) => (ex.id === exId ? { ...ex, [field]: num } : ex)),
      })));
    }, []);

  const updateExerciseWeight = useCallback((exId: string, value: number | null) => {
    setDays((prev) => prev.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) =>
        ex.id === exId
          ? { ...ex, loadType: value === null ? 'BodyWeight' : 'ExternalWeight', plannedWeightKg: value }
          : ex,
      ),
    })));
  }, []);

  const toggleRepMode = useCallback((exId: string) => {
    setDays((prev) => prev.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const newMode = ex.repMode === 'reps' ? 'secs' : 'reps';
        return { ...ex, repMode: newMode, reps: newMode === 'secs' ? 30 : 12 };
      }),
    })));
  }, []);

  const removeExercise = useCallback((exId: string) => {
    setDays((prev) => prev.map((day) => ({
      ...day,
      exercises: day.exercises.filter((ex) => ex.id !== exId),
    })));
  }, []);

  const reorderExercises = useCallback((newOrder: CreateRoutineExercise[]) => {
    setDays((prev) => prev.map((day) =>
      day.id === activeDayIdRef.current ? { ...day, exercises: newOrder } : day,
    ));
  }, []);

  const handleAddExercise = useCallback((item: ExerciseSearchItem) => {
    const newExercise: CreateRoutineExercise = {
      id: generateId(),
      exerciseId: item.exerciseId,
      name: item.name,
      gifUrl: item.gifUrl,
      equipments: item.equipments ?? [],
      sets: 3,
      reps: 12,
      repMode: 'reps',
      restSeconds: 60,
      loadType: 'BodyWeight',
      plannedWeightKg: null,
    };
    setDays((prev) => prev.map((day) =>
      day.id === activeDayIdRef.current ? { ...day, exercises: [...day.exercises, newExercise] } : day,
    ));
  }, []);

  const handleReplaceExercise = useCallback((item: ExerciseSearchItem) => {
    setDays((prev) => prev.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) =>
        ex.id === replacingExerciseId
          ? { ...ex, exerciseId: item.exerciseId, name: item.name, gifUrl: item.gifUrl, equipments: item.equipments ?? [] }
          : ex,
      ),
    })));
    setReplacingExerciseId(null);
  }, [replacingExerciseId]);

  /* ── Validación + payload ─────────────────────────────────────────────── */

  const isValid = name.trim().length > 0 && days.some((d) => d.exercises.length > 0);

  const buildPayload = useCallback(
    (activate: boolean) => buildRoutinePayload(name, days, activate),
    [name, days],
  );

  return {
    name,
    setName,
    days,
    activeDayIndex,
    setActiveDayIndex,
    availableDays,
    activeDay,
    isValid,
    addDay,
    removeDay,
    copyDayExercises,
    updateExerciseField,
    updateExerciseWeight,
    toggleRepMode,
    removeExercise,
    reorderExercises,
    handleAddExercise,
    replacingExerciseId,
    setReplacingExerciseId,
    handleReplaceExercise,
    buildPayload,
  };
}

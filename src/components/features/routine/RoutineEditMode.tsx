/**
 * Modo edición in-place de una rutina (diseño oscuro zinc). Se renderiza desde
 * RoutineDetailView cuando isEditMode está activo. Es un wrapper fino sobre
 * useRoutineEditor + RoutineEditorView: solo aporta el init desde la Routine, la
 * acción de guardar (updateRoutine) y el fade de entrada. Toda la lógica de
 * estado y la UI se comparten con la creación de rutinas (DRY).
 */
import { RoutineEditorView } from '@/src/components/features/routine/RoutineEditorView';
import { useRoutineEditor } from '@/src/hooks/useRoutineEditor';
import { useWeightInventory } from '@/src/hooks/use-weight-inventory';
import {
  downloadFitnessRoutineOffline,
  enqueueRoutineUpdateOffline,
} from '@/src/offline/service';
import { getExerciseInfo } from '@/src/services/exercise.service';
import { updateRoutine } from '@/src/services/routine.service';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import { Routine, RoutineDay, RoutineExercise } from '@/src/types/routine';
import { calcDayApproxTime, routineToDraftDays } from '@/src/utils/routine-editor.utils';
import { getWeightOptions } from '@/src/utils/weight.utils';
import { useAuth } from '@clerk/clerk-expo';
import React, { useCallback, useEffect, useState } from 'react';
import { confirm, toast } from '@/src/components/ui/feedback';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface RoutineEditModeProps {
  routine: Routine;
  /** Sale del modo edición descartando cambios sin guardar. */
  onExit: () => void;
  /** Se llamó tras guardar con éxito; recibe la rutina actualizada. */
  onRoutineUpdated: (routine: Routine) => void;
  /** Offline: permite editar solo ejercicios existentes y encola el update. */
  offlineLimited?: boolean;
}

const draftExerciseToRoutineExercise = (
  exercise: CreateRoutineExercise,
  order: number,
): RoutineExercise => ({
  id: exercise.id,
  exerciseId: exercise.exerciseId,
  order: String(order),
  name: exercise.name,
  gifUrl: exercise.gifUrl,
  sets: String(exercise.sets),
  repType: exercise.repMode === 'secs' ? 'Timed' : 'Fixed',
  minRep: null,
  maxRep: null,
  currentRep: exercise.repMode === 'reps' ? String(exercise.reps) : null,
  durationSeconds: exercise.repMode === 'secs' ? String(exercise.reps) : null,
  rest: String(exercise.restSeconds),
  loadType: exercise.loadType,
  plannedWeightKg: exercise.loadType === 'ExternalWeight' ? exercise.plannedWeightKg : null,
  primaryMuscleGroup: null,
});

const buildOptimisticRoutine = (
  routine: Routine,
  name: string,
  days: CreateRoutineDay[],
): Routine => {
  const routineDays: RoutineDay[] = days
    .filter((day) => day.exercises.length > 0)
    .map((day): RoutineDay => ({
      id: day.id,
      day: day.value,
      approxTimeSession: `${calcDayApproxTime(day.exercises)} min aprox.`,
      exercises: day.exercises.map(draftExerciseToRoutineExercise),
    }));

  return {
    ...routine,
    name: name.trim(),
    days: routineDays,
  };
};

export const RoutineEditMode: React.FC<RoutineEditModeProps> = ({
  routine,
  onExit,
  onRoutineUpdated,
  offlineLimited = false,
}) => {
  const { getToken } = useAuth();
  const { inventory } = useWeightInventory();

  const editor = useRoutineEditor({
    initialName: routine.name,
    initialDays: routineToDraftDays(routine.days),
  });

  const [isSaving, setIsSaving] = useState(false);

  /**
   * El DTO de la rutina no trae el equipamiento por ejercicio, así que al editar
   * lo cargamos aparte (deduplicado por exerciseId) y lo inyectamos al draft. Sin
   * esto, las opciones de peso quedan genéricas y el peso guardado no se muestra.
   */
  const { setExercisesEquipments } = editor;
  useEffect(() => {
    const exerciseIds = Array.from(
      new Set(routine.days.flatMap((day) => day.exercises.map((ex) => ex.exerciseId))),
    );
    if (exerciseIds.length === 0) return;

    let cancelled = false;
    (async () => {
      const token = await getToken();
      const entries = await Promise.all(
        exerciseIds.map(async (id) => {
          try {
            const info = await getExerciseInfo(id, token);
            return [id, info.equipments] as const;
          } catch {
            return [id, [] as string[]] as const;
          }
        }),
      );
      if (cancelled) return;
      setExercisesEquipments(Object.fromEntries(entries));
    })();

    return () => { cancelled = true; };
  }, [routine.id, getToken, setExercisesEquipments]);

  /** Opciones de peso filtradas por el equipamiento del ejercicio (igual que al crear). */
  const weightOptionsFor = useCallback(
    (exercise: CreateRoutineExercise) => getWeightOptions(exercise.equipments, inventory),
    [inventory],
  );

  /* ── Fade de entrada ──────────────────────────────────────────────────── */

  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, []);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  /* ── Menú del día (solo eliminar) ─────────────────────────────────────── */

  const handleDayOptions = useCallback(async (day: CreateRoutineDay) => {
    const confirmed = await confirm({
      title: day.label,
      message: '¿Eliminar este día de la rutina?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (confirmed) editor.removeDay(day.id);
  }, [editor.removeDay]);

  /* ── Guardar ──────────────────────────────────────────────────────────── */

  const handleSave = useCallback(async () => {
    if (!editor.isValid || isSaving) return;
    setIsSaving(true);
    try {
      if (offlineLimited) {
        const updatePayload = editor.buildPayload(routine.isActive);
        const optimisticRoutine = buildOptimisticRoutine(routine, editor.name, editor.days);
        await enqueueRoutineUpdateOffline({
          routineId: routine.id,
          updatePayload,
          offlineRoutine: optimisticRoutine,
          baseVersionId: routine.activeVersionId ?? null,
        });
        await downloadFitnessRoutineOffline(null, optimisticRoutine);
        toast.success(
          'Los cambios quedaron pendientes y se sincronizarán cuando vuelvas a tener conexión.',
          { title: 'Guardado offline' },
        );
        onRoutineUpdated(optimisticRoutine);
        return;
      }

      const token = await getToken();
      const updated = await updateRoutine(routine.id, editor.buildPayload(routine.isActive), token);
      onRoutineUpdated(updated);
    } catch {
      toast.error('No se pudo guardar la rutina. Revisá tu conexión e intentá nuevamente.', { title: 'Error al actualizar' });
      setIsSaving(false);
    }
  }, [
    editor,
    isSaving,
    offlineLimited,
    routine,
    getToken,
    onRoutineUpdated,
  ]);

  return (
    <Animated.View style={[{ flex: 1 }, fadeStyle]}>
      <RoutineEditorView
        editor={editor}
        weightOptionsFor={weightOptionsFor}
        onBack={onExit}
        backIcon="chevron-back"
        onDayOptions={handleDayOptions}
        saveLabel="Guardar cambios"
        onSave={handleSave}
        isSaving={isSaving}
        offlineLimited={offlineLimited}
      />
    </Animated.View>
  );
};

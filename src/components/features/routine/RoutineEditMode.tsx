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
import { updateRoutine } from '@/src/services/routine.service';
import { CreateRoutineDay } from '@/src/types/create-routine';
import { Routine } from '@/src/types/routine';
import { routineToDraftDays } from '@/src/utils/routine-editor.utils';
import { getWeightOptions } from '@/src/utils/weight.utils';
import { useAuth } from '@clerk/clerk-expo';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface RoutineEditModeProps {
  routine: Routine;
  /** Sale del modo edición descartando cambios sin guardar. */
  onExit: () => void;
  /** Se llamó tras guardar con éxito; recibe la rutina actualizada. */
  onRoutineUpdated: (routine: Routine) => void;
}

export const RoutineEditMode: React.FC<RoutineEditModeProps> = ({ routine, onExit, onRoutineUpdated }) => {
  const { getToken } = useAuth();
  const { inventory } = useWeightInventory();

  const editor = useRoutineEditor({
    initialName: routine.name,
    initialDays: routineToDraftDays(routine.days),
  });

  const [isSaving, setIsSaving] = useState(false);

  /** En edición no hay equipamiento por ejercicio → opciones de peso genéricas. */
  const weightOptions = useMemo(() => getWeightOptions(undefined, inventory), [inventory]);
  const weightOptionsFor = useCallback(() => weightOptions, [weightOptions]);

  /* ── Fade de entrada ──────────────────────────────────────────────────── */

  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, []);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  /* ── Menú del día (solo eliminar) ─────────────────────────────────────── */

  const handleDayOptions = useCallback((day: CreateRoutineDay) => {
    Alert.alert(day.label, '¿Eliminar este día de la rutina?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => editor.removeDay(day.id) },
    ]);
  }, [editor.removeDay]);

  /* ── Guardar ──────────────────────────────────────────────────────────── */

  const handleSave = useCallback(async () => {
    if (!editor.isValid || isSaving) return;
    setIsSaving(true);
    try {
      const token = await getToken();
      const updated = await updateRoutine(routine.id, editor.buildPayload(routine.isActive), token);
      onRoutineUpdated(updated);
    } catch {
      Alert.alert('Error al actualizar', 'No se pudo guardar la rutina. Revisá tu conexión e intentá nuevamente.');
      setIsSaving(false);
    }
  }, [editor.isValid, editor.buildPayload, isSaving, routine.id, routine.isActive, getToken, onRoutineUpdated]);

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
      />
    </Animated.View>
  );
};

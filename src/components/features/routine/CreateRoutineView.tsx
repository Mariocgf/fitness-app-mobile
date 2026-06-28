/**
 * Creación de una rutina manual (diseño oscuro zinc). Wrapper fino sobre
 * useRoutineEditor + RoutineEditorView: comparte estado y UI con la edición
 * (DRY) y solo aporta lo propio de crear: animación de zoom desde la card del
 * FAB, autoguardado de borrador al cerrar, copiar ejercicios entre días y el
 * diálogo "Guardar y activar".
 */
import { CardLayout } from '@/src/components/features/routine/RoutineDetailView';
import { RoutineEditorView } from '@/src/components/features/routine/RoutineEditorView';
import { useRoutineEditor } from '@/src/hooks/useRoutineEditor';
import { useWeightInventory } from '@/src/hooks/use-weight-inventory';
import { createRoutine } from '@/src/services/routine.service';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import { Routine } from '@/src/types/routine';
import { getWeightOptions } from '@/src/utils/weight.utils';
import { useAuth } from '@clerk/clerk-expo';
import React, { useCallback, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface CreateRoutineViewProps {
  onClose: () => void;
  cardLayout?: CardLayout;
  initialDraft?: { name: string; days: CreateRoutineDay[] };
  onSaveDraft?: (name: string, days: CreateRoutineDay[]) => void;
  onClearDraft?: () => void;
  onRoutineCreated?: (routine: Routine) => void;
}

export const CreateRoutineView: React.FC<CreateRoutineViewProps> = ({
  onClose,
  cardLayout,
  initialDraft,
  onSaveDraft,
  onClearDraft,
  onRoutineCreated,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { getToken } = useAuth();
  const { inventory } = useWeightInventory();

  const editor = useRoutineEditor({
    initialName: initialDraft?.name,
    initialDays: initialDraft?.days,
  });

  const [isSaving, setIsSaving] = useState(false);

  /** Al crear, las opciones de peso se filtran por el equipamiento del ejercicio. */
  const weightOptionsFor = useCallback(
    (exercise: CreateRoutineExercise) => getWeightOptions(exercise.equipments[0], inventory),
    [inventory],
  );

  /* ── Animación de entrada/salida (zoom desde la card del FAB) ──────────── */

  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, []);

  /** Cierra con animación */
  const performClose = useCallback(() => {
    progress.value = withTiming(0, { duration: 280, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, progress]);

  /** Guarda borrador si hay datos y cierra */
  const handleClose = useCallback(() => {
    const hasData = editor.name.trim().length > 0 || editor.days.length > 0;
    if (hasData) onSaveDraft?.(editor.name, editor.days);
    performClose();
  }, [editor.name, editor.days, onSaveDraft, performClose]);

  const containerStyle = useAnimatedStyle(() => {
    if (cardLayout) {
      return {
        position: 'absolute' as const,
        top: interpolate(progress.value, [0, 1], [cardLayout.y, 0], Extrapolation.CLAMP),
        left: interpolate(progress.value, [0, 1], [cardLayout.x, 0], Extrapolation.CLAMP),
        width: interpolate(progress.value, [0, 1], [cardLayout.width, screenWidth], Extrapolation.CLAMP),
        height: interpolate(progress.value, [0, 1], [cardLayout.height, screenHeight], Extrapolation.CLAMP),
        borderRadius: interpolate(progress.value, [0, 1], [24, 0], Extrapolation.CLAMP),
        overflow: 'hidden' as const,
        zIndex: 40,
      };
    }
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: screenWidth,
      height: screenHeight,
      opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP) }],
      zIndex: 40,
    };
  });

  const contentOpacity = useAnimatedStyle(() => ({
    opacity: cardLayout
      ? interpolate(progress.value, [0.4, 0.8], [0, 1], Extrapolation.CLAMP)
      : 1,
  }));

  /* ── Menú del día (copiar ejercicios a otro día / eliminar) ─────────────── */

  const handleDayOptions = useCallback((day: CreateRoutineDay) => {
    const otherDays = editor.days.filter((d) => d.id !== day.id);
    const copyOption = day.exercises.length > 0 && otherDays.length > 0
      ? [{
          text: 'Copiar ejercicios a...',
          onPress: () => {
            Alert.alert(
              `Copiar desde ${day.label}`,
              'Seleccioná el día destino',
              [
                { text: 'Cancelar', style: 'cancel' as const },
                ...otherDays.map((target) => ({
                  text: target.label,
                  onPress: () => {
                    if (target.exercises.length > 0) {
                      Alert.alert(
                        'Reemplazar ejercicios',
                        `${target.label} ya tiene ejercicios. ¿Reemplazarlos?`,
                        [
                          { text: 'Cancelar', style: 'cancel' as const },
                          { text: 'Reemplazar', style: 'destructive' as const, onPress: () => editor.copyDayExercises(day, target) },
                        ],
                      );
                    } else {
                      editor.copyDayExercises(day, target);
                    }
                  },
                })),
              ],
            );
          },
        }]
      : [];

    Alert.alert(day.label, '¿Qué querés hacer?', [
      { text: 'Cancelar', style: 'cancel' },
      ...copyOption,
      { text: 'Eliminar día', style: 'destructive', onPress: () => editor.removeDay(day.id) },
    ]);
  }, [editor.days, editor.copyDayExercises, editor.removeDay]);

  /* ── Guardar (con opción de activar) ──────────────────────────────────── */

  const doSave = useCallback(async (activate: boolean) => {
    if (!editor.isValid) return;
    setIsSaving(true);
    try {
      const token = await getToken();
      const routine = await createRoutine(editor.buildPayload(activate), token);
      onClearDraft?.();
      onRoutineCreated?.(routine);
    } catch {
      Alert.alert(
        'Error al guardar',
        'No se pudo guardar la rutina. Revisá tu conexión e intentá nuevamente.',
      );
      setIsSaving(false);
    }
  }, [editor.isValid, editor.buildPayload, onClearDraft, onRoutineCreated, getToken]);

  const handleSave = useCallback(() => {
    if (!editor.isValid) return;
    const emptyDays = editor.days.filter((d) => d.exercises.length === 0);
    const daysToSave = editor.days.filter((d) => d.exercises.length > 0);

    const confirmAlert = () =>
      Alert.alert(
        '¿Cómo querés guardar?',
        `"${editor.name.trim()}" — ${daysToSave.length} ${daysToSave.length === 1 ? 'día' : 'días'} con ejercicios.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Solo guardar', onPress: () => doSave(false) },
          { text: 'Guardar y activar', onPress: () => doSave(true) },
        ],
      );

    if (emptyDays.length > 0) {
      const names = emptyDays.map((d) => d.label).join(', ');
      Alert.alert(
        'Días sin ejercicios',
        `${names} ${emptyDays.length === 1 ? 'no tiene' : 'no tienen'} ejercicios y ${emptyDays.length === 1 ? 'será ignorado' : 'serán ignorados'} al guardar. ¿Continuás?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: confirmAlert },
        ],
      );
    } else {
      confirmAlert();
    }
  }, [editor.isValid, editor.name, editor.days, doSave]);

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <Animated.View style={containerStyle} className="bg-zinc-950">
      {cardLayout && (
        <Animated.View style={contentOpacity} className="absolute inset-0 bg-zinc-950" />
      )}
      <Animated.View style={cardLayout ? [{ flex: 1 }, contentOpacity] : { flex: 1 }}>
        <RoutineEditorView
          editor={editor}
          weightOptionsFor={weightOptionsFor}
          onBack={handleClose}
          backIcon="close"
          onDayOptions={handleDayOptions}
          saveLabel="Guardar rutina"
          onSave={handleSave}
          isSaving={isSaving}
        />
      </Animated.View>
    </Animated.View>
  );
};

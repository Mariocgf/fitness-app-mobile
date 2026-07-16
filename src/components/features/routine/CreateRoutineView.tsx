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
import { confirm, toast } from '@/src/components/ui/feedback';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useAuth } from '@clerk/clerk-expo';
import React, { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
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
  const { showActionSheetWithOptions } = useActionSheet();

  const editor = useRoutineEditor({
    initialName: initialDraft?.name,
    initialDays: initialDraft?.days,
  });

  const [isSaving, setIsSaving] = useState(false);

  /** Al crear, las opciones de peso se filtran por el equipamiento del ejercicio. */
  const weightOptionsFor = useCallback(
    (exercise: CreateRoutineExercise) => getWeightOptions(exercise.equipments, inventory),
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

  /* ── Menús de acción (action sheet tematizado dark) ─────────────────────── */

  type MenuAction = { label: string; onPress: () => void; destructive?: boolean };

  /** Presenta un action sheet dark con una lista de acciones (+ Cancelar al final). */
  const presentMenu = useCallback(
    (title: string, actions: MenuAction[]) => {
      const options = [...actions.map((a) => a.label), 'Cancelar'];
      showActionSheetWithOptions(
        {
          title,
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: actions.findIndex((a) => a.destructive),
          containerStyle: { backgroundColor: '#18181b' },
          textStyle: { color: '#f4f4f5' },
          titleTextStyle: { color: '#a1a1aa' },
          destructiveColor: '#f87171',
        },
        (selectedIndex) => {
          if (selectedIndex != null && selectedIndex < actions.length) {
            actions[selectedIndex].onPress();
          }
        },
      );
    },
    [showActionSheetWithOptions],
  );

  /* ── Menú del día (copiar ejercicios a otro día / eliminar) ─────────────── */

  const handleDayOptions = useCallback((day: CreateRoutineDay) => {
    const otherDays = editor.days.filter((d) => d.id !== day.id);

    const copyToTarget = async (target: CreateRoutineDay) => {
      if (target.exercises.length > 0) {
        const confirmed = await confirm({
          title: 'Reemplazar ejercicios',
          message: `${target.label} ya tiene ejercicios. ¿Reemplazarlos?`,
          confirmText: 'Reemplazar',
          cancelText: 'Cancelar',
          destructive: true,
        });
        if (!confirmed) return;
      }
      editor.copyDayExercises(day, target);
    };

    const actions: MenuAction[] = [];
    if (day.exercises.length > 0 && otherDays.length > 0) {
      actions.push({
        label: 'Copiar ejercicios a...',
        onPress: () =>
          // Android necesita que la modal del sheet anterior termine de desmontarse
          // antes de abrir la siguiente; sin este delay, la segunda no aparece.
          setTimeout(() => {
            presentMenu(
              `Copiar desde ${day.label}`,
              otherDays.map((target) => ({ label: target.label, onPress: () => copyToTarget(target) })),
            );
          }, 500),
      });
    }
    actions.push({ label: 'Eliminar día', onPress: () => editor.removeDay(day.id), destructive: true });

    presentMenu(day.label, actions);
  }, [editor.days, editor.copyDayExercises, editor.removeDay, presentMenu]);

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
      toast.error('No se pudo guardar la rutina. Revisá tu conexión e intentá nuevamente.', {
        title: 'Error al guardar',
      });
      setIsSaving(false);
    }
  }, [editor.isValid, editor.buildPayload, onClearDraft, onRoutineCreated, getToken]);

  const handleSave = useCallback(async () => {
    if (!editor.isValid) return;
    const emptyDays = editor.days.filter((d) => d.exercises.length === 0);
    const daysToSave = editor.days.filter((d) => d.exercises.length > 0);

    if (emptyDays.length > 0) {
      const names = emptyDays.map((d) => d.label).join(', ');
      const proceed = await confirm({
        title: 'Días sin ejercicios',
        message: `${names} ${emptyDays.length === 1 ? 'no tiene' : 'no tienen'} ejercicios y ${emptyDays.length === 1 ? 'será ignorado' : 'serán ignorados'} al guardar. ¿Continuás?`,
        confirmText: 'Continuar',
        cancelText: 'Cancelar',
      });
      if (!proceed) return;
    }

    presentMenu(
      `"${editor.name.trim()}" — ${daysToSave.length} ${daysToSave.length === 1 ? 'día' : 'días'} con ejercicios.`,
      [
        { label: 'Solo guardar', onPress: () => doSave(false) },
        { label: 'Guardar y activar', onPress: () => doSave(true) },
      ],
    );
  }, [editor.isValid, editor.name, editor.days, doSave, presentMenu]);

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

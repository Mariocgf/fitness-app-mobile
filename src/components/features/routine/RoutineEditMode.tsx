/**
 * Modo edición in-place de una rutina, con el mismo diseño oscuro de la vista de
 * detalle. Se renderiza desde RoutineDetailView cuando isEditMode está activo.
 * Reutiliza la lógica de creación (campos, drag, días) en tema oscuro y guarda
 * vía updateRoutine. Drag nativo con react-native-draggable-flatlist (Expo Go OK).
 */
import { AddExerciseSheet } from '@/src/components/features/routine/AddExerciseSheet';
import { EditDayPickerModal } from '@/src/components/features/routine/EditDayPickerModal';
import { EditExerciseCard } from '@/src/components/features/routine/EditExerciseCard';
import { StatPickerSheet } from '@/src/components/features/routine/StatPickerSheet';
import {
  BOTTOM_BUTTON_HEIGHT,
  DaySlot,
  SLOT_CONFIGS,
  TAB_BAR_HEIGHT,
} from '@/src/components/features/routine/routine-detail-shared';
import { translateDay } from '@/src/i18n';
import { useWeightInventory } from '@/src/hooks/use-weight-inventory';
import { ExerciseSearchItem } from '@/src/services/exercise.service';
import { CreateRoutinePayload, updateRoutine } from '@/src/services/routine.service';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import { Routine, RoutineDay } from '@/src/types/routine';
import { getWeightOptions } from '@/src/utils/weight.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ── Helpers de edición ───────────────────────────────────────────────────── */

/** Mapa de días: valor en inglés → etiqueta en español (orden semanal) */
const DAYS_MAP: { value: string; label: string }[] = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

/** Extrae la clave en inglés (monday…sunday) contenida en la etiqueta del día */
const getDayKey = (dayLabel: string): string | null => {
  const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return keys.find(k => dayLabel.toLowerCase().includes(k)) ?? null;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** Tiempo aproximado de sesión (min) a partir de los ejercicios de un día */
const calcDayApproxTime = (exercises: CreateRoutineExercise[]): number => {
  if (exercises.length === 0) return 0;
  const totalSeconds = exercises.reduce((acc, ex) => {
    const execTime = ex.repMode === 'secs' ? ex.reps * ex.sets : ex.reps * 3 * ex.sets;
    const restTime = ex.restSeconds * (ex.sets - 1);
    return acc + (execTime + restTime) * 1.15;
  }, 0);
  return Math.round(totalSeconds / 60);
};

/** Convierte los días de una Routine al formato editable (draft) */
const routineToDraftDays = (days: RoutineDay[]): CreateRoutineDay[] =>
  days.map((day): CreateRoutineDay => {
    const key = getDayKey(day.day);
    return {
      id: day.id,
      value: key ?? day.day.toLowerCase(),
      label: key ? translateDay(key) : day.day,
      exercises: day.exercises.map((ex): CreateRoutineExercise => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        name: ex.name,
        gifUrl: ex.gifUrl,
        equipments: [],
        sets: parseInt(ex.sets, 10) || 3,
        reps: ex.repType === 'Timed'
          ? parseInt(ex.durationSeconds ?? '30', 10)
          : parseInt(ex.currentRep ?? ex.minRep ?? '12', 10),
        repMode: ex.repType === 'Timed' ? 'secs' : 'reps',
        restSeconds: parseInt(ex.rest, 10) || 60,
        loadType: ex.loadType ?? 'BodyWeight',
        plannedWeightKg: ex.loadType === 'ExternalWeight' ? ex.plannedWeightKg : null,
      })),
    };
  });

/* ──────────────────────────────────────────────────────────────────────────── */
/*                       Modo edición (mismo diseño oscuro)                      */
/* ──────────────────────────────────────────────────────────────────────────── */

interface RoutineEditModeProps {
  routine: Routine;
  /** Sale del modo edición descartando cambios sin guardar. */
  onExit: () => void;
  /** Se llamó tras guardar con éxito; recibe la rutina actualizada. */
  onRoutineUpdated: (routine: Routine) => void;
}

export const RoutineEditMode: React.FC<RoutineEditModeProps> = ({ routine, onExit, onRoutineUpdated }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { getToken } = useAuth();
  const { inventory } = useWeightInventory();

  const [name, setName] = useState(routine.name);
  const [days, setDays] = useState<CreateRoutineDay[]>(() =>
    [...routineToDraftDays(routine.days)].sort(
      (a, b) => DAYS_MAP.findIndex(d => d.value === a.value) - DAYS_MAP.findIndex(d => d.value === b.value),
    ),
  );
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  /** Stat que se está editando en el wheel picker (null = cerrado). */
  const [activePicker, setActivePicker] = useState<{ exId: string; field: 'sets' | 'reps' | 'restSeconds' | 'weight' } | null>(null);

  /** Opciones de peso (en edición no hay equipamiento por ejercicio → genéricas) */
  const weightOptions = useMemo(() => getWeightOptions(undefined, inventory), [inventory]);

  /* ── Días disponibles + slot "+" ─────────────────────────────────────── */

  const availableDays = useMemo(
    () => DAYS_MAP.filter(d => !days.some(dd => dd.value === d.value)),
    [days],
  );
  const hasAddSlot = availableDays.length > 0;
  const totalSlots = days.length + (hasAddSlot ? 1 : 0);
  const maxIndex = Math.max(0, days.length - 1 + (hasAddSlot ? 1 : 0));
  const clampedIndex = Math.min(activeDayIndex, maxIndex);
  const isAddSlot = hasAddSlot && clampedIndex === days.length;
  const activeDay = isAddSlot ? null : (days[clampedIndex] ?? null);

  // Refs para leer valores frescos dentro de gestos/handlers estables
  const activeDayIdRef = useRef<string | null>(null);
  activeDayIdRef.current = activeDay?.id ?? null;
  const maxIndexRef = useRef(maxIndex);
  maxIndexRef.current = maxIndex;

  const clampedIndexRef = useRef(clampedIndex);
  clampedIndexRef.current = clampedIndex;

  /* ── Animación de entrada ─────────────────────────────────────────────── */

  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, []);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  /* ── Cross-fade del header de días (mismo que la vista de detalle) ────── */

  const scrollX = useSharedValue(clampedIndex * screenWidth);
  const baseOffset = useSharedValue(clampedIndex * screenWidth);

  // Al terminar la animación, activeDayIndex cambia → este effect reasienta el
  // baseOffset al nuevo día (p vuelve a 0 con scrollX ya en destino).
  useEffect(() => {
    baseOffset.value = clampedIndex * screenWidth;
    scrollX.value = clampedIndex * screenWidth;
  }, [clampedIndex, screenWidth]);

  /** Anima el cross-fade hacia un día y recién al final actualiza el índice. */
  const goToDay = useCallback((target: number) => {
    const clamped = Math.max(0, Math.min(target, maxIndexRef.current));
    if (clamped === clampedIndexRef.current) return;
    // baseOffset queda en el día actual durante la animación → produce el cross-fade
    scrollX.value = withTiming(
      clamped * screenWidth,
      { duration: 320, easing: Easing.out(Easing.cubic) },
      (finished) => { if (finished) runOnJS(setActiveDayIndex)(clamped); },
    );
  }, [screenWidth]);

  /* ── Gesto de swipe entre días ────────────────────────────────────────── */

  const dayGesture = useMemo(() =>
    Gesture.Pan()
      .activeOffsetX([-20, 20])
      .runOnJS(true)
      .onEnd(e => {
        if (e.translationX < -40 || e.velocityX < -400) {
          goToDay(clampedIndexRef.current + 1);
        } else if (e.translationX > 40 || e.velocityX > 400) {
          goToDay(clampedIndexRef.current - 1);
        }
      }),
  [goToDay]);

  /* ── Handlers de días ─────────────────────────────────────────────────── */

  const addDay = useCallback((value: string, label: string) => {
    setDays(prev => {
      const next = [...prev, { id: generateId(), value, label, exercises: [] }].sort(
        (a, b) => DAYS_MAP.findIndex(d => d.value === a.value) - DAYS_MAP.findIndex(d => d.value === b.value),
      );
      setActiveDayIndex(next.findIndex(d => d.value === value));
      return next;
    });
    setIsDayPickerOpen(false);
  }, []);

  const removeDay = useCallback((dayId: string) => {
    setDays(prev => prev.filter(d => d.id !== dayId));
    setActiveDayIndex(i => Math.max(0, i - 1));
  }, []);

  const confirmRemoveDay = useCallback((day: CreateRoutineDay) => {
    Alert.alert(day.label, '¿Eliminar este día de la rutina?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeDay(day.id) },
    ]);
  }, [removeDay]);

  /* ── Handlers de ejercicios (por id, robustos al cambio de día) ───────── */

  const updateExerciseField = useCallback(
    (exId: string, field: 'sets' | 'reps' | 'restSeconds', value: string) => {
      const num = parseInt(value, 10) || 0;
      setDays(prev => prev.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => (ex.id === exId ? { ...ex, [field]: num } : ex)),
      })));
    }, []);

  const updateExerciseWeight = useCallback((exId: string, value: number | null) => {
    setDays(prev => prev.map(day => ({
      ...day,
      exercises: day.exercises.map(ex =>
        ex.id === exId
          ? { ...ex, loadType: value === null ? 'BodyWeight' : 'ExternalWeight', plannedWeightKg: value }
          : ex,
      ),
    })));
  }, []);

  const toggleRepMode = useCallback((exId: string) => {
    setDays(prev => prev.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        const newMode = ex.repMode === 'reps' ? 'secs' : 'reps';
        return { ...ex, repMode: newMode, reps: newMode === 'secs' ? 30 : 12 };
      }),
    })));
  }, []);

  const removeExercise = useCallback((exId: string) => {
    setDays(prev => prev.map(day => ({
      ...day,
      exercises: day.exercises.filter(ex => ex.id !== exId),
    })));
  }, []);

  const reorderExercises = useCallback((newOrder: CreateRoutineExercise[]) => {
    setDays(prev => prev.map(day =>
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
    setDays(prev => prev.map(day =>
      day.id === activeDayIdRef.current ? { ...day, exercises: [...day.exercises, newExercise] } : day,
    ));
  }, []);

  const handleReplaceExercise = useCallback((item: ExerciseSearchItem) => {
    setDays(prev => prev.map(day => ({
      ...day,
      exercises: day.exercises.map(ex =>
        ex.id === replacingExerciseId
          ? { ...ex, exerciseId: item.exerciseId, name: item.name, gifUrl: item.gifUrl, equipments: item.equipments ?? [] }
          : ex,
      ),
    })));
    setReplacingExerciseId(null);
  }, [replacingExerciseId]);

  /* ── Guardar ──────────────────────────────────────────────────────────── */

  const isValid = name.trim().length > 0 && days.some(d => d.exercises.length > 0);

  const handleSave = useCallback(async () => {
    if (!isValid || isSaving) return;
    const daysToSave = days.filter(d => d.exercises.length > 0);
    setIsSaving(true);
    try {
      const token = await getToken();
      const payload: CreateRoutinePayload = {
        name: name.trim(),
        activate: routine.isActive,
        days: daysToSave.map(day => ({
          dayOfWeek: day.value,
          approxTimeSession: calcDayApproxTime(day.exercises),
          exercises: day.exercises.map((ex, idx) => ({
            exerciseId: ex.exerciseId,
            order: idx + 1,
            sets: ex.sets,
            repMode: ex.repMode,
            reps: ex.repMode === 'reps' ? ex.reps : null,
            durationSeconds: ex.repMode === 'secs' ? ex.reps : null,
            restSeconds: ex.restSeconds,
            loadType: ex.loadType,
            plannedWeightKg: ex.loadType === 'ExternalWeight' ? ex.plannedWeightKg : null,
          })),
        })),
      };
      const updated = await updateRoutine(routine.id, payload, token);
      onRoutineUpdated(updated);
    } catch {
      Alert.alert('Error al actualizar', 'No se pudo guardar la rutina. Revisá tu conexión e intentá nuevamente.');
      setIsSaving(false);
    }
  }, [isValid, isSaving, days, name, routine.id, routine.isActive, getToken, onRoutineUpdated]);

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[{ flex: 1 }, fadeStyle]}>
        {/* Header: salir + nombre editable */}
        <View
          className="flex-row items-center px-4"
          style={{ paddingTop: insets.top + 12, paddingBottom: 8 }}
        >
          <TouchableOpacity
            onPress={onExit}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} className="text-white" />
          </TouchableOpacity>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre de rutina"
            placeholderTextColor="#71717a"
            className="flex-1 text-white text-base font-semibold text-center mx-3"
            returnKeyType="done"
          />
          <View className="w-9" />
        </View>

        {/* Header de días (swipe + slot "+") */}
        <GestureDetector gesture={dayGesture}>
          <Pressable
            className="px-6 pt-1 pb-4"
            onPress={() => { if (isAddSlot) setIsDayPickerOpen(true); }}
          >
            <View className="flex-row items-baseline gap-6">
              {SLOT_CONFIGS.slice(0, Math.min(3, totalSlots)).map((cfg, slotIdx) => {
                const i = clampedIndex + slotIdx;
                const nameAt = (idx: number) => {
                  if (idx >= 0 && idx < days.length) return days[idx].label;
                  if (hasAddSlot && idx === days.length) return '+ Día';
                  return '';
                };
                return (
                  <DaySlot
                    key={slotIdx}
                    prev={nameAt(i - 1)}
                    current={nameAt(i)}
                    next={nameAt(i + 1)}
                    fontSize={cfg.fontSize}
                    color={cfg.color}
                    scrollX={scrollX}
                    baseOffset={baseOffset}
                    screenWidth={screenWidth}
                    accent={{ text: '+ Día', color: '#a3e635' }}
                  />
                );
              })}
            </View>
            {isAddSlot ? (
              <Text className="text-lime-400/80 text-sm mt-0.5">Tocá para agregar un día</Text>
            ) : activeDay ? (
              <View className="flex-row items-center gap-3 mt-0.5">
                <Text className="text-zinc-500 text-sm">
                  {activeDay.exercises.length}{' '}
                  {activeDay.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                  {activeDay.exercises.length > 0 && `  •  ≈${calcDayApproxTime(activeDay.exercises)} min`}
                </Text>
                <TouchableOpacity onPress={() => confirmRemoveDay(activeDay)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={15} className="text-zinc-600" />
                </TouchableOpacity>
              </View>
            ) : null}
          </Pressable>
        </GestureDetector>

        {/* Cuerpo: lista editable del día activo o prompt de "+" */}
        <View style={{ flex: 1 }}>
          {isAddSlot ? (
            <View className="flex-1 items-center justify-center px-8">
              <TouchableOpacity
                onPress={() => setIsDayPickerOpen(true)}
                className="w-20 h-20 rounded-full bg-white/10 items-center justify-center mb-4"
              >
                <Ionicons name="add" size={36} className="text-lime-400" />
              </TouchableOpacity>
              <Text className="text-zinc-400 text-base text-center">
                Elegí un día para sumar a tu rutina
              </Text>
            </View>
          ) : activeDay ? (
            <DraggableFlatList
              data={activeDay.exercises}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data }) => reorderExercises(data)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 4,
                paddingBottom: insets.bottom + TAB_BAR_HEIGHT + BOTTOM_BUTTON_HEIGHT + 32,
              }}
              renderItem={({ item, getIndex, drag, isActive }: RenderItemParams<CreateRoutineExercise>) => (
                <ScaleDecorator activeScale={1.02}>
                  <EditExerciseCard
                    exercise={item}
                    index={getIndex() ?? 0}
                    weightLabel={weightOptions.find(o => o.value === item.plannedWeightKg)?.label ?? weightOptions[0]?.label ?? '—'}
                    onOpenPicker={(field) => setActivePicker({ exId: item.id, field })}
                    onRemove={removeExercise}
                    onReplace={(id) => setReplacingExerciseId(id)}
                    onToggleRepMode={toggleRepMode}
                    onDrag={drag}
                    isActive={isActive}
                  />
                </ScaleDecorator>
              )}
              ListFooterComponent={
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsAddExerciseOpen(true)}
                  className="bg-zinc-900 rounded-2xl p-4 border border-white/10 items-center justify-center mt-1"
                >
                  <Ionicons name="add" size={26} className="text-lime-400" />
                  <Text className="text-zinc-400 text-sm mt-1 font-medium">Agregar ejercicio</Text>
                </TouchableOpacity>
              }
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-zinc-500">Esta rutina no tiene días.</Text>
            </View>
          )}
        </View>

        {/* Botón guardar */}
        <View
          className="absolute w-full px-4"
          style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 8 }}
        >
          <TouchableOpacity
            className="w-full h-[60px] bg-white rounded-2xl items-center justify-center"
            style={{ opacity: isValid && !isSaving ? 1 : 0.45 }}
            disabled={!isValid || isSaving}
            onPress={handleSave}
          >
            {isSaving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-zinc-900 font-bold text-base">Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Selector de día */}
      <EditDayPickerModal
        visible={isDayPickerOpen}
        availableDays={availableDays}
        onSelect={addDay}
        onClose={() => setIsDayPickerOpen(false)}
      />

      {/* Agregar ejercicio */}
      <AddExerciseSheet
        visible={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onAdd={handleAddExercise}
        excludedExerciseIds={activeDay?.exercises.map(ex => ex.exerciseId) ?? []}
      />

      {/* Reemplazar ejercicio */}
      <AddExerciseSheet
        visible={replacingExerciseId !== null}
        onClose={() => setReplacingExerciseId(null)}
        onAdd={handleReplaceExercise}
        confirmLabel="Cambiar"
        excludedExerciseIds={
          (activeDay?.exercises ?? [])
            .filter(ex => ex.id !== replacingExerciseId)
            .map(ex => ex.exerciseId)
        }
      />

      {/* Wheel picker para Sets / Reps / Rest / Peso */}
      <StatPickerSheet
        picker={activePicker}
        days={days}
        weightOptions={weightOptions}
        onChangeField={updateExerciseField}
        onChangeWeight={updateExerciseWeight}
        onClose={() => setActivePicker(null)}
      />
    </View>
  );
};

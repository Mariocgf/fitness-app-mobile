/**
 * Modo edición in-place de una rutina, con el mismo diseño oscuro de la vista de
 * detalle. Se renderiza desde RoutineDetailView cuando isEditMode está activo.
 * Reutiliza la lógica de creación (campos, drag, días) en tema oscuro y guarda
 * vía updateRoutine. Drag nativo con react-native-draggable-flatlist (Expo Go OK).
 */
import { AddExerciseSheet } from '@/src/components/features/routine/AddExerciseSheet';
import { ExerciseThumbnail } from '@/src/components/features/routine/ExerciseThumbnail';
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
import { WeightOption, getWeightOptions } from '@/src/utils/weight.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Gesture, GestureDetector, Swipeable } from 'react-native-gesture-handler';
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

/* ──────────────────────────────────────────────────────────────────────────── */
/*                       Card de ejercicio en modo edición                      */
/* ──────────────────────────────────────────────────────────────────────────── */

interface EditExerciseCardProps {
  exercise: CreateRoutineExercise;
  index: number;
  weightLabel: string;
  onOpenPicker: (field: 'sets' | 'reps' | 'restSeconds' | 'weight') => void;
  onRemove: (exId: string) => void;
  onReplace: (exId: string) => void;
  onToggleRepMode: (exId: string) => void;
  onDrag: () => void;
  isActive: boolean;
}

/** Stat inline (label gris arriba, valor blanco abajo) — al tocar abre el wheel picker */
const EditStat = ({
  label, value, onPress, onLabelPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
  onLabelPress?: () => void;
}) => (
  <View className="items-center" style={{ minWidth: 40 }}>
    {onLabelPress ? (
      <TouchableOpacity onPress={onLabelPress} hitSlop={6} className="flex-row items-center mb-0.5">
        <Text className="text-zinc-500 text-[10px]">{label}</Text>
        <Ionicons name="swap-horizontal" size={9} color="#52525b" style={{ marginLeft: 2 }} />
      </TouchableOpacity>
    ) : (
      <Text className="text-zinc-500 text-[10px] mb-0.5">{label}</Text>
    )}
    <TouchableOpacity onPress={onPress} hitSlop={8} className="px-1">
      <Text className="text-white font-bold text-sm text-center">{value}</Text>
    </TouchableOpacity>
  </View>
);

const EditExerciseCard: React.FC<EditExerciseCardProps> = ({
  exercise, index, weightLabel, onOpenPicker, onRemove, onReplace, onToggleRepMode, onDrag, isActive,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const openMenu = () => {
    Alert.alert(exercise.name, undefined, [
      { text: 'Cambiar ejercicio', onPress: () => onReplace(exercise.id) },
      { text: `Peso: ${weightLabel}`, onPress: () => onOpenPicker('weight') },
      { text: 'Eliminar', style: 'destructive', onPress: () => onRemove(exercise.id) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const renderRightActions = () => (
    <View className="flex-row ml-3 mb-3 gap-2">
      <TouchableOpacity
        onPress={() => { swipeableRef.current?.close(); onReplace(exercise.id); }}
        className="bg-blue-500 rounded-2xl items-center justify-center px-4"
      >
        <Ionicons name="swap-horizontal" size={22} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onRemove(exercise.id)}
        className="bg-red-500 rounded-2xl items-center justify-center px-4"
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} enabled={!isActive}>
      <View
        className="flex-row items-center gap-2 bg-zinc-900 rounded-2xl border border-white/10 p-3 mb-3"
        style={isActive ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 } : undefined}
      >
        {/* Handle de 6 puntos (izquierda) — long-press para arrastrar */}
        <TouchableOpacity onLongPress={onDrag} delayLongPress={150} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <MaterialCommunityIcons name="drag-vertical" size={22} color="#52525b" />
        </TouchableOpacity>

        {/* Número de orden */}
        <Text className="text-zinc-600 font-bold text-sm w-4 text-center">{index + 1}</Text>

        {/* GIF / imagen */}
        <ExerciseThumbnail uri={exercise.gifUrl} size={56} />

        {/* Nombre */}
        <Text className="flex-1 text-white font-bold text-sm" numberOfLines={2}>{exercise.name}</Text>

        {/* Stats — al tocar abren el wheel picker */}
        <EditStat label="Sets" value={String(exercise.sets)} onPress={() => onOpenPicker('sets')} />
        <EditStat
          label={exercise.repMode === 'secs' ? 'Seg' : 'Reps'}
          value={String(exercise.reps)}
          onPress={() => onOpenPicker('reps')}
          onLabelPress={() => onToggleRepMode(exercise.id)}
        />
        <EditStat label="Rest" value={String(exercise.restSeconds)} onPress={() => onOpenPicker('restSeconds')} />

        {/* Menú de 3 puntos (derecha) */}
        <TouchableOpacity
          onPress={openMenu}
          className="w-8 h-8 rounded-full bg-white/10 items-center justify-center ml-1"
          hitSlop={6}
        >
          <Ionicons name="ellipsis-vertical" size={16} className="text-zinc-300" />
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
};

/* ── Wheel picker (scroll vertical estilo iOS) — puro JS, Expo Go OK ───────── */

const WHEEL_ITEM_H = 44;
const WHEEL_VISIBLE = 5; // 2 arriba + centro + 2 abajo

const WheelPicker = ({ items, value, onChange }: {
  items: { value: number | null; label: string }[];
  value: number | null;
  onChange: (value: number | null) => void;
}) => {
  const ref = useRef<ScrollView>(null);
  const didInit = useRef(false);
  const initialIndex = Math.max(0, items.findIndex(i => i.value === value));

  const handleMomentumEnd = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const idx = Math.min(items.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_H)));
    const picked = items[idx];
    if (picked && picked.value !== value) onChange(picked.value);
  };

  return (
    <View style={{ height: WHEEL_ITEM_H * WHEEL_VISIBLE }}>
      {/* Banda central que resalta el valor seleccionado */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: WHEEL_ITEM_H * 2, height: WHEEL_ITEM_H }}
        className="border-y border-white/10 bg-white/5 rounded-xl"
      />
      <ScrollView
        ref={ref}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: WHEEL_ITEM_H * 2 }}
        onMomentumScrollEnd={handleMomentumEnd}
        onLayout={() => {
          if (didInit.current) return;
          didInit.current = true;
          ref.current?.scrollTo({ y: initialIndex * WHEEL_ITEM_H, animated: false });
        }}
      >
        {items.map((it, i) => {
          const selected = it.value === value;
          return (
            <View key={i} style={{ height: WHEEL_ITEM_H }} className="items-center justify-center">
              <Text className={selected ? 'text-white font-bold text-xl' : 'text-zinc-500 text-lg'}>{it.label}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

/* ── Bottom sheet con wheel picker para Sets / Reps / Rest / Peso ──────────── */

const buildRange = (from: number, to: number, step = 1): { value: number | null; label: string }[] => {
  const arr: { value: number | null; label: string }[] = [];
  for (let n = from; n <= to; n += step) arr.push({ value: n, label: String(n) });
  return arr;
};

interface StatPickerSheetProps {
  picker: { exId: string; field: 'sets' | 'reps' | 'restSeconds' | 'weight' } | null;
  days: CreateRoutineDay[];
  weightOptions: WeightOption[];
  onChangeField: (exId: string, field: 'sets' | 'reps' | 'restSeconds', value: string) => void;
  onChangeWeight: (exId: string, value: number | null) => void;
  onClose: () => void;
}

const StatPickerSheet: React.FC<StatPickerSheetProps> = ({
  picker, days, weightOptions, onChangeField, onChangeWeight, onClose,
}) => {
  const exercise = useMemo(() => {
    if (!picker) return null;
    for (const d of days) {
      const ex = d.exercises.find(e => e.id === picker.exId);
      if (ex) return ex;
    }
    return null;
  }, [picker, days]);

  const config = useMemo(() => {
    if (!picker || !exercise) return null;
    switch (picker.field) {
      case 'sets':
        return { title: 'Series', items: buildRange(1, 12), value: exercise.sets as number | null };
      case 'reps':
        return exercise.repMode === 'secs'
          ? { title: 'Segundos', items: buildRange(5, 240, 5), value: exercise.reps as number | null }
          : { title: 'Repeticiones', items: buildRange(1, 50), value: exercise.reps as number | null };
      case 'restSeconds':
        return { title: 'Descanso (seg)', items: buildRange(0, 300, 5), value: exercise.restSeconds as number | null };
      case 'weight':
        return { title: 'Peso', items: weightOptions as { value: number | null; label: string }[], value: exercise.plannedWeightKg };
      default:
        return null;
    }
  }, [picker, exercise, weightOptions]);

  const handlePick = (val: number | null) => {
    if (!picker) return;
    if (picker.field === 'weight') onChangeWeight(picker.exId, val);
    else onChangeField(picker.exId, picker.field, String(val ?? 0));
  };

  return (
    <Modal visible={!!picker && !!config} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop y sheet como hermanos: el ScrollView de la rueda scrollea libre */}
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="bg-zinc-900 rounded-t-3xl px-6 pt-5 pb-10">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-bold text-white">{config?.title}</Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1.5 rounded-full bg-white/10">
              <Text className="text-white font-semibold text-sm">Listo</Text>
            </TouchableOpacity>
          </View>
          {config && (
            <WheelPicker
              key={`${picker?.exId}-${picker?.field}`}
              items={config.items}
              value={config.value}
              onChange={handlePick}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

/* ── Modal selector de día (oscuro) ───────────────────────────────────────── */

interface EditDayPickerModalProps {
  visible: boolean;
  availableDays: { value: string; label: string }[];
  onSelect: (value: string, label: string) => void;
  onClose: () => void;
}

const EditDayPickerModal: React.FC<EditDayPickerModalProps> = ({ visible, availableDays, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
      <Pressable className="bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-10">
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-xl font-bold text-white">Seleccionar día</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} className="text-zinc-400" />
          </TouchableOpacity>
        </View>
        {availableDays.map(day => (
          <Pressable
            key={day.value}
            onPress={() => onSelect(day.value, day.label)}
            className="py-4 border-b border-white/5"
          >
            <Text className="text-base font-medium text-zinc-200">{day.label}</Text>
          </Pressable>
        ))}
        {availableDays.length === 0 && (
          <Text className="text-zinc-500 text-center py-4">Ya agregaste todos los días.</Text>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);

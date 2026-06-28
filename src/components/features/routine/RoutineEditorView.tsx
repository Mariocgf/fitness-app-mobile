/**
 * Vista presentacional compartida para crear/editar una rutina manual (diseño
 * oscuro zinc): header con nombre editable, navegación de días con cross-fade
 * (DaySlot), lista de ejercicios reordenable, wheel picker de stats y botón de
 * guardar flotante. La lógica de estado vive en useRoutineEditor; las diferencias
 * entre crear y editar (init, acción de guardado, menú del día) llegan por props.
 */
import { AddExerciseSheet } from '@/src/components/features/routine/AddExerciseSheet';
import { EditDayPickerModal } from '@/src/components/features/routine/EditDayPickerModal';
import { EditExerciseCard } from '@/src/components/features/routine/EditExerciseCard';
import {
  BOTTOM_BUTTON_HEIGHT,
  DaySlot,
  SLOT_CONFIGS,
  TAB_BAR_HEIGHT,
} from '@/src/components/features/routine/routine-detail-shared';
import { StatPickerSheet } from '@/src/components/features/routine/StatPickerSheet';
import { RoutineEditor } from '@/src/hooks/useRoutineEditor';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import { calcDayApproxTime } from '@/src/utils/routine-editor.utils';
import { WeightOption } from '@/src/utils/weight.utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RoutineEditorViewProps {
  editor: RoutineEditor;
  /** Opciones de peso para un ejercicio (crear filtra por equipamiento; editar usa genéricas) */
  weightOptionsFor: (exercise: CreateRoutineExercise) => WeightOption[];
  onBack: () => void;
  /** Ícono del botón de retroceso: "close" en crear (overlay), "chevron-back" en editar */
  backIcon?: 'chevron-back' | 'close';
  /** Abre el menú de opciones del día activo (copiar/eliminar). El wrapper arma el Alert. */
  onDayOptions: (day: CreateRoutineDay) => void;
  saveLabel: string;
  onSave: () => void;
  isSaving: boolean;
}

export const RoutineEditorView: React.FC<RoutineEditorViewProps> = ({
  editor,
  weightOptionsFor,
  onBack,
  backIcon = 'chevron-back',
  onDayOptions,
  saveLabel,
  onSave,
  isSaving,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { days, availableDays, isValid } = editor;

  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  /** Stat que se está editando en el wheel picker (null = cerrado). */
  const [activePicker, setActivePicker] = useState<{ exId: string; field: 'sets' | 'reps' | 'restSeconds' | 'weight' } | null>(null);

  /* ── Días disponibles + slot "+" ─────────────────────────────────────── */

  const hasAddSlot = availableDays.length > 0;
  const totalSlots = days.length + (hasAddSlot ? 1 : 0);
  const maxIndex = Math.max(0, days.length - 1 + (hasAddSlot ? 1 : 0));
  const clampedIndex = Math.min(editor.activeDayIndex, maxIndex);
  const isAddSlot = hasAddSlot && clampedIndex === days.length;
  const activeDay = isAddSlot ? null : (days[clampedIndex] ?? null);

  // Refs para leer valores frescos dentro de gestos estables
  const maxIndexRef = useRef(maxIndex);
  maxIndexRef.current = maxIndex;
  const clampedIndexRef = useRef(clampedIndex);
  clampedIndexRef.current = clampedIndex;

  /* ── Cross-fade del header de días (mismo patrón que la vista de detalle) ── */

  const scrollX = useSharedValue(clampedIndex * screenWidth);
  const baseOffset = useSharedValue(clampedIndex * screenWidth);

  useEffect(() => {
    baseOffset.value = clampedIndex * screenWidth;
    scrollX.value = clampedIndex * screenWidth;
  }, [clampedIndex, screenWidth]);

  /** Anima el cross-fade hacia un día y recién al final actualiza el índice. */
  const goToDay = useCallback((target: number) => {
    const clamped = Math.max(0, Math.min(target, maxIndexRef.current));
    if (clamped === clampedIndexRef.current) return;
    scrollX.value = withTiming(
      clamped * screenWidth,
      { duration: 320, easing: Easing.out(Easing.cubic) },
      (finished) => { if (finished) runOnJS(editor.setActiveDayIndex)(clamped); },
    );
  }, [screenWidth, editor.setActiveDayIndex]);

  const dayGesture = useMemo(() =>
    Gesture.Pan()
      .activeOffsetX([-20, 20])
      .runOnJS(true)
      .onEnd((e) => {
        if (e.translationX < -40 || e.velocityX < -400) {
          goToDay(clampedIndexRef.current + 1);
        } else if (e.translationX > 40 || e.velocityX > 400) {
          goToDay(clampedIndexRef.current - 1);
        }
      }),
  [goToDay]);

  /* ── Opciones de peso del ejercicio que está en el wheel picker ─────────── */

  const pickerExercise = useMemo(() => {
    if (!activePicker) return null;
    for (const d of days) {
      const ex = d.exercises.find((e) => e.id === activePicker.exId);
      if (ex) return ex;
    }
    return null;
  }, [activePicker, days]);

  const pickerWeightOptions = useMemo(
    () => (pickerExercise ? weightOptionsFor(pickerExercise) : []),
    [pickerExercise, weightOptionsFor],
  );

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <View style={{ flex: 1 }} className="bg-zinc-950">
      {/* Header: retroceso + nombre editable */}
      <View
        className="flex-row items-center px-4"
        style={{ paddingTop: insets.top + 12, paddingBottom: 8 }}
      >
        <TouchableOpacity
          onPress={onBack}
          className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
        >
          <Ionicons name={backIcon} size={20} className="text-white" />
        </TouchableOpacity>
        <TextInput
          value={editor.name}
          onChangeText={editor.setName}
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
              <TouchableOpacity onPress={() => onDayOptions(activeDay)} hitSlop={8}>
                <Ionicons name="ellipsis-horizontal" size={16} className="text-zinc-600" />
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
            onDragEnd={({ data }) => editor.reorderExercises(data)}
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
                  weightLabel={
                    weightOptionsFor(item).find((o) => o.value === item.plannedWeightKg)?.label
                    ?? weightOptionsFor(item)[0]?.label
                    ?? '—'
                  }
                  onOpenPicker={(field) => setActivePicker({ exId: item.id, field })}
                  onRemove={editor.removeExercise}
                  onReplace={(id) => editor.setReplacingExerciseId(id)}
                  onToggleRepMode={editor.toggleRepMode}
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

      {/* Botón guardar flotante (sobre el tab bar nativo) */}
      <View
        className="absolute w-full px-4"
        style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 8 }}
      >
        <TouchableOpacity
          className="w-full h-[60px] bg-white rounded-2xl items-center justify-center"
          style={{ opacity: isValid && !isSaving ? 1 : 0.45 }}
          disabled={!isValid || isSaving}
          onPress={onSave}
        >
          {isSaving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-zinc-900 font-bold text-base">{saveLabel}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Selector de día */}
      <EditDayPickerModal
        visible={isDayPickerOpen}
        availableDays={availableDays}
        onSelect={(value, label) => { editor.addDay(value, label); setIsDayPickerOpen(false); }}
        onClose={() => setIsDayPickerOpen(false)}
      />

      {/* Agregar ejercicio */}
      <AddExerciseSheet
        visible={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onAdd={editor.handleAddExercise}
        excludedExerciseIds={activeDay?.exercises.map((ex) => ex.exerciseId) ?? []}
      />

      {/* Reemplazar ejercicio */}
      <AddExerciseSheet
        visible={editor.replacingExerciseId !== null}
        onClose={() => editor.setReplacingExerciseId(null)}
        onAdd={editor.handleReplaceExercise}
        confirmLabel="Cambiar"
        excludedExerciseIds={
          (activeDay?.exercises ?? [])
            .filter((ex) => ex.id !== editor.replacingExerciseId)
            .map((ex) => ex.exerciseId)
        }
      />

      {/* Wheel picker para Sets / Reps / Rest / Peso */}
      <StatPickerSheet
        picker={activePicker}
        days={days}
        weightOptions={pickerWeightOptions}
        onChangeField={editor.updateExerciseField}
        onChangeWeight={editor.updateExerciseWeight}
        onClose={() => setActivePicker(null)}
      />
    </View>
  );
};

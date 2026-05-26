import { DarkSheetLayout } from '@/src/components/common/DarkSheetLayout';
import { CardLayout } from '@/src/components/features/routine/RoutineDetailView';
import { useWeightInventory } from '@/src/hooks/use-weight-inventory';
import { WeightInventoryResponse } from '@/src/services/equipment.service';
import { ExerciseSearchItem } from '@/src/services/exercise.service';
import { CreateRoutinePayload, createRoutine, updateRoutine } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { CreateRoutineDay, CreateRoutineExercise, RoutineDraft } from '@/src/types/create-routine';
import { Routine } from '@/src/types/routine';
import { WeightOption, getWeightOptions } from '@/src/utils/weight.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddExerciseSheet } from './AddExerciseSheet';

/* ──────────────────────────────────────────────────────────────────────────── */
/*                              Constantes                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

/** Mapa de días: valor en inglés → etiqueta en español */
const DAYS_MAP: { value: string; label: string }[] = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

/** Genera un id temporal */
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/* ──────────────────────────────────────────────────────────────────────────── */
/*                              Props                                            */
/* ──────────────────────────────────────────────────────────────────────────── */

interface CreateRoutineViewProps {
  onClose: () => void;
  cardLayout?: CardLayout;
  initialDraft?: RoutineDraft;
  onSaveDraft?: (name: string, days: CreateRoutineDay[]) => void;
  onClearDraft?: () => void;
  onRoutineCreated?: (routine: Routine) => void;
  /** Si se pasa, la vista funciona en modo edición y llama PUT en vez de POST */
  editingRoutineId?: string;
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*                         CreateRoutineView                                     */
/* ──────────────────────────────────────────────────────────────────────────── */

export const CreateRoutineView: React.FC<CreateRoutineViewProps> = ({ onClose, cardLayout, initialDraft, onSaveDraft, onClearDraft, onRoutineCreated, editingRoutineId }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { getToken } = useAuth();

  /* ── Estado del formulario ─────────────────────────────────────────────── */

  const [name, setName] = useState(initialDraft?.name ?? '');
  const [days, setDays] = useState<CreateRoutineDay[]>(initialDraft?.days ?? []);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* ── Inventario de pesos del usuario ──────────────────────────────────── */

  const { inventory } = useWeightInventory();

  /* ── Registro en contexto para FAB del MyTabBar ────────────────────────── */

  const { setIsEditingRoutine, saveRoutineRef, isFormValidRef } = useRoutineDetailContext();

  /* ── Animación de entrada/salida ───────────────────────────────────────── */

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
    const hasData = name.trim().length > 0 || days.length > 0;
    if (hasData) {
      onSaveDraft?.(name, days);
    }
    performClose();
  }, [name, days, onSaveDraft, performClose]);

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

  /* ── Días disponibles para agregar ─────────────────────────────────────── */

  const usedDayValues = useMemo(() => new Set(days.map((d) => d.value)), [days]);
  const availableDays = useMemo(() => DAYS_MAP.filter((d) => !usedDayValues.has(d.value)), [usedDayValues]);

  /* ── Handlers de días ──────────────────────────────────────────────────── */

  const addDay = useCallback((value: string, label: string) => {
    const newDay: CreateRoutineDay = { id: generateId(), value, label, exercises: [] };
    setDays((prev) => {
      const next = [...prev, newDay].sort(
        (a, b) => DAYS_MAP.findIndex((d) => d.value === a.value) - DAYS_MAP.findIndex((d) => d.value === b.value),
      );
      const insertedIndex = next.findIndex((d) => d.value === value);
      setActiveDayIndex(insertedIndex);
      return next;
    });
    setIsDayPickerOpen(false);
  }, []);

  const removeDay = useCallback((dayId: string) => {
    setDays((prev) => {
      const filtered = prev.filter((d) => d.id !== dayId);
      return filtered;
    });
    setActiveDayIndex((prev) => Math.max(0, prev >= days.length - 1 ? days.length - 2 : prev));
  }, [days.length]);

  const copyDayExercises = useCallback((fromDay: CreateRoutineDay, toDay: CreateRoutineDay) => {
    const copiedExercises = fromDay.exercises.map((ex) => ({ ...ex, id: generateId() }));
    setDays((prev) =>
      prev.map((d) => (d.id === toDay.id ? { ...d, exercises: copiedExercises } : d)),
    );
  }, []);

  const handleDayLongPress = useCallback((day: CreateRoutineDay) => {
    const otherDays = days.filter((d) => d.id !== day.id);
    const copyOption = day.exercises.length > 0 && otherDays.length > 0
      ? [{
          text: 'Copiar ejercicios a...',
          onPress: () => {
            Alert.alert(
              `Copiar desde ${day.label}`,
              'Seleccioná el día destino',
              [
                { text: 'Cancelar', style: 'cancel' },
                ...otherDays.map((target) => ({
                  text: target.label,
                  onPress: () => {
                    if (target.exercises.length > 0) {
                      Alert.alert(
                        'Reemplazar ejercicios',
                        `${target.label} ya tiene ejercicios. ¿Reemplazarlos?`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Reemplazar', style: 'destructive', onPress: () => copyDayExercises(day, target) },
                        ],
                      );
                    } else {
                      copyDayExercises(day, target);
                    }
                  },
                })),
              ],
            );
          },
        }]
      : [];

    Alert.alert(
      day.label,
      '¿Qué querés hacer?',
      [
        { text: 'Cancelar', style: 'cancel' },
        ...copyOption,
        { text: 'Eliminar día', style: 'destructive', onPress: () => removeDay(day.id) },
      ],
    );
  }, [days, removeDay, copyDayExercises]);

  /* ── Handlers de ejercicios ────────────────────────────────────────────── */

  const activeDay = days[activeDayIndex] ?? null;

  const updateExerciseField = useCallback(
    (exerciseId: string, field: keyof Pick<CreateRoutineExercise, 'sets' | 'reps' | 'restSeconds'>, value: string) => {
      const numValue = parseInt(value, 10) || 0;
      setDays((prev) =>
        prev.map((day, idx) => {
          if (idx !== activeDayIndex) return day;
          return {
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.id === exerciseId ? { ...ex, [field]: numValue } : ex,
            ),
          };
        }),
      );
    },
    [activeDayIndex],
  );

  const updateExerciseWeight = useCallback(
    (exerciseId: string, value: number | null) => {
      setDays((prev) =>
        prev.map((day, idx) => {
          if (idx !== activeDayIndex) return day;
          return {
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.id === exerciseId ? { ...ex, weightKg: value } : ex,
            ),
          };
        }),
      );
    },
    [activeDayIndex],
  );

  const removeExercise = useCallback((exerciseId: string) => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== activeDayIndex) return day;
        return { ...day, exercises: day.exercises.filter((ex) => ex.id !== exerciseId) };
      }),
    );
  }, [activeDayIndex]);

  const reorderExercises = useCallback((newOrder: CreateRoutineExercise[]) => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== activeDayIndex) return day;
        return { ...day, exercises: newOrder };
      }),
    );
  }, [activeDayIndex]);

  /** ID del ejercicio que se está reemplazando (null = ninguno) */
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);

  /** Reemplaza el ejercicio manteniendo sets/reps/descanso/peso */
  const handleReplaceExercise = useCallback(
    (item: ExerciseSearchItem) => {
      if (!replacingExerciseId) return;
      setDays((prev) =>
        prev.map((day, idx) => {
          if (idx !== activeDayIndex) return day;
          return {
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.id === replacingExerciseId
                ? { ...ex, exerciseId: item.exerciseId, name: item.name, gifUrl: item.gifUrl, equipments: item.equipments ?? [] }
                : ex,
            ),
          };
        }),
      );
      setReplacingExerciseId(null);
    },
    [replacingExerciseId, activeDayIndex],
  );

  /** Agrega un ejercicio seleccionado desde el sheet al día activo */
  const handleAddExercise = useCallback(
    (item: ExerciseSearchItem) => {
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
        weightKg: null,
      };
      setDays((prev) =>
        prev.map((day, idx) => {
          if (idx !== activeDayIndex) return day;
          return { ...day, exercises: [...day.exercises, newExercise] };
        }),
      );
    },
    [activeDayIndex],
  );

  const toggleRepMode = useCallback((exerciseId: string) => {
    setDays((prev) =>
      prev.map((day) => {
        if (!day.exercises.some((ex) => ex.id === exerciseId)) return day;
        return {
          ...day,
          exercises: day.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const newMode = ex.repMode === 'reps' ? 'secs' : 'reps';
            return { ...ex, repMode: newMode, reps: newMode === 'secs' ? 30 : 12 };
          }),
        };
      }),
    );
  }, []);

  /* ── Duración estimada del día activo ───────────────────────────────────── */

  const estimatedDuration = useMemo(() => {
    const activeDayExercises = days[activeDayIndex]?.exercises ?? [];
    if (activeDayExercises.length === 0) return null;
    const totalSeconds = activeDayExercises.reduce((acc, ex) => {
      const execTime = ex.repMode === 'secs' ? ex.reps * ex.sets : ex.reps * 3 * ex.sets;
      const restTime = ex.restSeconds * (ex.sets - 1);
      return acc + (execTime + restTime) * 1.15;
    }, 0);
    const minutes = Math.round(totalSeconds / 60);
    return minutes;
  }, [days, activeDayIndex]);

  /* ── Validación + Guardar ──────────────────────────────────────────────── */

  const isValid = name.trim().length > 0 && days.some((d) => d.exercises.length > 0);

  /** Calcula el tiempo aproximado de sesión de un día en minutos (entero) */
  const calcDayApproxTime = (exercises: CreateRoutineExercise[]): number => {
    if (exercises.length === 0) return 0;
    const totalSeconds = exercises.reduce((acc, ex) => {
      const execTime = ex.repMode === 'secs' ? ex.reps * ex.sets : ex.reps * 3 * ex.sets;
      const restTime = ex.restSeconds * (ex.sets - 1);
      return acc + (execTime + restTime) * 1.15;
    }, 0);
    return Math.round(totalSeconds / 60);
  };

  const doSave = useCallback(async (activate: boolean) => {
    if (!isValid) return;
    const daysToSave = days.filter((d) => d.exercises.length > 0);
    setIsSaving(true);
    try {
      const token = await getToken();
      const payload: CreateRoutinePayload = {
        name: name.trim(),
        activate,
        days: daysToSave.map((day) => ({
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
            weightKg: ex.weightKg,
          })),
        })),
      };
      console.log('[CreateRoutineView] doSave →', {
        mode: editingRoutineId ? 'UPDATE' : 'CREATE',
        editingRoutineId,
        activate,
        payloadName: payload.name,
        daysCount: payload.days.length,
      });
      const routine = editingRoutineId
        ? await updateRoutine(editingRoutineId, payload, token)
        : await createRoutine(payload, token);
      console.log('[CreateRoutineView] doSave response →', { returnedId: routine.id, returnedName: routine.name });
      onClearDraft?.();
      onRoutineCreated?.(routine);
    } catch {
      Alert.alert(
        editingRoutineId ? 'Error al actualizar' : 'Error al guardar',
        'No se pudo guardar la rutina. Revisá tu conexión e intentá nuevamente.',
      );
      setIsSaving(false);
    }
  }, [isValid, name, days, editingRoutineId, onClearDraft, onRoutineCreated, getToken]);

  const handleSave = useCallback(() => {
    if (!isValid) return;
    const emptyDays = days.filter((d) => d.exercises.length === 0);
    const daysToSave = days.filter((d) => d.exercises.length > 0);

    const confirmAlert = () =>
      Alert.alert(
        editingRoutineId ? '¿Cómo querés guardar los cambios?' : '¿Cómo querés guardar?',
        `"${name.trim()}" — ${daysToSave.length} ${daysToSave.length === 1 ? 'día' : 'días'} con ejercicios.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: editingRoutineId ? 'Guardar cambios' : 'Solo guardar', onPress: () => doSave(false) },
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
  }, [isValid, name, days, editingRoutineId, doSave]);

  saveRoutineRef.current = doSave;
  isFormValidRef.current = isValid;

  React.useEffect(() => {
    if (editingRoutineId) setIsEditingRoutine(true);
    return () => {
      if (editingRoutineId) setIsEditingRoutine(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingRoutineId]);

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <Animated.View style={containerStyle} className="bg-slate-100 dark:bg-slate-950">
      {cardLayout && (
        <Animated.View
          style={contentOpacity}
          className="absolute inset-0 bg-slate-100 dark:bg-slate-950"
        />
      )}
      <Animated.View style={cardLayout ? [{ flex: 1 }, contentOpacity] : { flex: 1 }}>
      <DarkSheetLayout
        header={
          <>
            {/* Header: botón X + input de nombre */}
            <View style={{ paddingTop: insets.top + 12 }} className="px-4 pb-3">
              <View className="items-end mb-3">
                <TouchableOpacity
                  onPress={handleClose}
                  className="bg-slate-300 dark:bg-slate-700 w-10 h-10 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View className="items-center">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nombre de rutina"
                  placeholderTextColor="#94a3b8"
                  className="text-2xl font-bold text-center text-slate-900 dark:text-white w-full"
                  returnKeyType="done"
                />
                <Text className="text-slate-400 text-sm mt-1 text-center">
                  {days.length} {days.length === 1 ? 'día' : 'días'}
                  {estimatedDuration !== null && (
                    <Text className="text-slate-400 text-sm">{'  ·  ≈'}{estimatedDuration} min</Text>
                  )}
                </Text>
              </View>
            </View>

            {/* Selector de días */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
            >
              {days.map((day, index) => {
                const isActive = activeDayIndex === index;
                return (
                  <TouchableOpacity
                    key={day.id}
                    onPress={() => setActiveDayIndex(index)}
                    onLongPress={() => handleDayLongPress(day)}
                    className={`px-5 py-2 rounded-full border ${
                      isActive ? 'bg-lime-400 border-lime-400' : 'border-slate-400 dark:border-slate-600'
                    }`}
                  >
                    <Text
                      className={`font-semibold text-sm ${
                        isActive ? 'text-black' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Botón + para agregar día */}
              {availableDays.length > 0 && (
                <TouchableOpacity
                  onPress={() => setIsDayPickerOpen(true)}
                  className="w-10 h-10 rounded-full border border-slate-400 dark:border-slate-600 items-center justify-center"
                >
                  <Ionicons name="add" size={22} color="#a3e635" />
                </TouchableOpacity>
              )}
            </ScrollView>
          </>
        }
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-4 pt-4" style={{ paddingBottom: insets.bottom + 100 }}>
            {activeDay ? (
              <>
                {/* Lista de ejercicios con drag & drop */}
                <DraggableFlatList
                  data={activeDay.exercises}
                  keyExtractor={(item) => item.id}
                  onDragEnd={({ data }) => reorderExercises(data)}
                  scrollEnabled={false}
                  renderItem={({ item: exercise, getIndex, drag, isActive }: RenderItemParams<CreateRoutineExercise>) => (
                    <ScaleDecorator activeScale={1.02}>
                      <ExerciseFormCard
                        exercise={exercise}
                        index={getIndex() ?? 0}
                        inventory={inventory}
                        onUpdateField={updateExerciseField}
                        onUpdateWeight={updateExerciseWeight}
                        onRemove={removeExercise}
                        onReplace={(id) => setReplacingExerciseId(id)}
                        onToggleRepMode={toggleRepMode}
                        onDrag={drag}
                        isActive={isActive}
                      />
                    </ScaleDecorator>
                  )}
                />

                {/* Card "Agregar ejercicio" */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsAddExerciseOpen(true)}
                  className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 items-center justify-center"
                >
                  <Ionicons name="add" size={28} color="#a3e635" />
                  <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
                    Agregar ejercicio
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center justify-center py-16">
                <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
                <Text className="text-slate-400 dark:text-slate-500 text-base mt-3 text-center">
                  Agregá un día para comenzar
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </DarkSheetLayout>

      {/* Bottom bar oculto — el FAB lo reemplaza en todos los modos */}
      {false && <View className="absolute w-full px-4 z-10 flex-row gap-3" style={{ bottom: insets.bottom + 8 }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid || isSaving}
          activeOpacity={isValid && !isSaving ? 0.8 : 1}
          className={`flex-1 h-[60px] rounded-full items-center justify-center ${
            isValid && !isSaving ? 'bg-slate-900 dark:bg-slate-950' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          {isSaving ? (
            <ActivityIndicator color="#a3e635" />
          ) : (
            <Text className={`font-semibold text-base ${isValid ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
              Guardar y activar
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsOptionsOpen(true)}
          disabled={isSaving}
          className="w-[60px] h-[60px] bg-slate-900 dark:bg-slate-950 rounded-full items-center justify-center"
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#f8fafc" />
        </TouchableOpacity>
      </View>}
      </Animated.View>

      {/* Dropdown de opciones */}
      <Modal
        visible={isOptionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOptionsOpen(false)}
      >
        <Pressable className="flex-1" onPress={() => setIsOptionsOpen(false)}>
          <View
            className="absolute right-4 w-[230px] bg-slate-800 dark:bg-slate-700 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              bottom: insets.bottom + 76,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setIsOptionsOpen(false);
                Alert.alert('Próximamente', 'La sugerencia de mejora con IA estará disponible pronto.');
              }}
              className="flex-row items-center px-[18px] py-[15px] gap-[14px]"
            >
              <Ionicons name="sparkles" size={19} color="#94a3b8" />
              <Text className="text-slate-100 text-[15px] font-medium">Sugerir mejora</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Modal selector de día */}
      <DayPickerModal
        visible={isDayPickerOpen}
        availableDays={availableDays}
        onSelect={addDay}
        onClose={() => setIsDayPickerOpen(false)}
      />

      {/* Bottom sheet para agregar ejercicios */}
      <AddExerciseSheet
        visible={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onAdd={handleAddExercise}
        excludedExerciseIds={activeDay?.exercises.map((ex) => ex.exerciseId) ?? []}
      />

      {/* Bottom sheet para reemplazar ejercicio */}
      <AddExerciseSheet
        visible={replacingExerciseId !== null}
        onClose={() => setReplacingExerciseId(null)}
        onAdd={handleReplaceExercise}
        confirmLabel="Cambiar"
        excludedExerciseIds={
          (activeDay?.exercises ?? [])
            .filter((ex) => ex.id !== replacingExerciseId)
            .map((ex) => ex.exerciseId)
        }
      />
    </Animated.View>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/*                          ExerciseFormCard                                     */
/* ──────────────────────────────────────────────────────────────────────────── */

interface ExerciseFormCardProps {
  exercise: CreateRoutineExercise;
  index: number;
  inventory: WeightInventoryResponse | null;
  onUpdateField: (
    exerciseId: string,
    field: keyof Pick<CreateRoutineExercise, 'sets' | 'reps' | 'restSeconds'>,
    value: string,
  ) => void;
  onUpdateWeight: (exerciseId: string, value: number | null) => void;
  onRemove: (exerciseId: string) => void;
  onReplace: (exerciseId: string) => void;
  onToggleRepMode: (exerciseId: string) => void;
  onDrag: () => void;
  isActive: boolean;
}

const ExerciseFormCard: React.FC<ExerciseFormCardProps> = ({
  exercise,
  index,
  inventory,
  onUpdateField,
  onUpdateWeight,
  onRemove,
  onReplace,
  onToggleRepMode,
  onDrag,
  isActive,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const weightOptions = getWeightOptions(exercise.equipments[0], inventory);
  /** Render de las acciones de swipe derecha (cambiar + eliminar) */
  const renderRightActions = () => (
    <View className="flex-row ml-3 mb-3 gap-2">
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onReplace(exercise.id);
        }}
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
        className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 mb-3"
        style={isActive ? { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 } : undefined}
      >
        <View className="flex-row items-center">
          {/* Número en círculo lime */}
          <View className="w-8 h-8 rounded-full bg-lime-400 items-center justify-center mr-3 shrink-0">
            <Text className="text-slate-900 text-xs font-bold">{index + 1}</Text>
          </View>

          {/* Imagen/GIF del ejercicio */}
          {exercise.gifUrl ? (
            <Image
              source={{ uri: exercise.gifUrl }}
              className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl mr-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl items-center justify-center mr-3">
              <Ionicons name="image-outline" size={22} color="#94a3b8" />
            </View>
          )}

          {/* Nombre */}
          <View className="flex-1">
            <Text className="font-bold text-base text-slate-900 dark:text-slate-50" numberOfLines={2}>
              {exercise.name}
            </Text>
          </View>

          {/* Handle de arrastre */}
          <TouchableOpacity
            onLongPress={onDrag}
            delayLongPress={150}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="pl-2"
          >
            <Ionicons name="reorder-three-outline" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Fila de inputs numéricos */}
        <View className="flex-row items-stretch mt-3 gap-2 flex-wrap">
          <NumericField
            label="Series"
            icon="layers-outline"
            value={exercise.sets}
            onChange={(v) => onUpdateField(exercise.id, 'sets', v)}
          />
          {/* Campo reps/seg con toggle */}
          <View className="flex-1 min-w-[70px] bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-2 items-center justify-center">
            <TouchableOpacity
              onPress={() => onToggleRepMode(exercise.id)}
              className="flex-row items-center mb-1"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={exercise.repMode === 'secs' ? 'timer-outline' : 'repeat-outline'}
                size={13}
                color="#a3e635"
              />
              <Text className="text-slate-400 text-xs ml-1">
                {exercise.repMode === 'secs' ? 'Seg' : 'Reps'}
              </Text>
              <Ionicons name="swap-horizontal" size={10} color="#64748b" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
            <TextInput
              value={String(exercise.reps)}
              onChangeText={(v) => onUpdateField(exercise.id, 'reps', v)}
              keyboardType="numeric"
              className="text-slate-900 dark:text-slate-50 font-bold text-base text-center w-full"
              returnKeyType="done"
            />
          </View>
          <NumericField
            label="Descanso"
            icon="time-outline"
            value={exercise.restSeconds}
            onChange={(v) => onUpdateField(exercise.id, 'restSeconds', v)}
          />
          <WeightSelectField
            value={exercise.weightKg}
            options={weightOptions}
            onChange={(v) => onUpdateWeight(exercise.id, v)}
          />
        </View>
      </View>
    </Swipeable>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/*                          NumericField                                         */
/* ──────────────────────────────────────────────────────────────────────────── */

interface NumericFieldProps {
  label: string;
  icon: string;
  value: number;
  onChange: (value: string) => void;
}

const NumericField: React.FC<NumericFieldProps> = ({ label, icon, value, onChange }) => (
  <View className="flex-1 min-w-[70px] bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-2 items-center justify-center">
    <View className="flex-row items-center mb-1">
      <Ionicons name={icon as any} size={13} color="#a3e635" />
      <Text className="text-slate-400 text-xs ml-1">{label}</Text>
    </View>
    <TextInput
      value={value > 0 ? String(value) : ''}
      onChangeText={onChange}
      keyboardType="number-pad"
      placeholder="0"
      placeholderTextColor="#94a3b8"
      className="text-slate-900 dark:text-white text-base font-bold text-center w-full"
    />
  </View>
);

/* ──────────────────────────────────────────────────────────────────────────── */
/*                          WeightSelectField                                    */
/* ──────────────────────────────────────────────────────────────────────────── */

interface WeightSelectFieldProps {
  value: number | null;
  options: WeightOption[];
  onChange: (value: number | null) => void;
}

const WeightSelectField: React.FC<WeightSelectFieldProps> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        className="flex-1 min-w-[70px] bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-2 items-center"
      >
        <View className="flex-row items-center mb-1">
          <Ionicons name="barbell-outline" size={13} color="#a3e635" />
          <Text className="text-slate-400 text-xs ml-1">Peso</Text>
        </View>
        <Text className="text-slate-900 dark:text-white text-base font-bold text-center">
          {selected.label}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-white dark:bg-slate-900 rounded-t-3xl px-6 pt-6 pb-10"
            style={{ maxHeight: '70%' }}
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-bold text-slate-900 dark:text-white">Seleccionar peso</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((opt) => (
                <Pressable
                  key={opt.value ?? 'null'}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                  className={`py-4 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between ${
                    opt.value === value ? 'opacity-100' : 'opacity-80'
                  }`}
                >
                  <Text className="text-base font-medium text-slate-700 dark:text-slate-200">
                    {opt.label}
                  </Text>
                  {opt.value === value && (
                    <Ionicons name="checkmark" size={20} color="#a3e635" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/*                          DayPickerModal                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

interface DayPickerModalProps {
  visible: boolean;
  availableDays: { value: string; label: string }[];
  onSelect: (value: string, label: string) => void;
  onClose: () => void;
}

const DayPickerModal: React.FC<DayPickerModalProps> = ({ visible, availableDays, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View className="flex-1 bg-black/50 justify-end">
      <View className="bg-white dark:bg-slate-900 rounded-t-3xl px-6 pt-6 pb-10">
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Seleccionar día</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {availableDays.map((day) => (
          <Pressable
            key={day.value}
            onPress={() => onSelect(day.value, day.label)}
            className="py-4 border-b border-slate-100 dark:border-slate-800"
          >
            <Text className="text-base font-medium text-slate-700 dark:text-slate-200">
              {day.label}
            </Text>
          </Pressable>
        ))}

        {availableDays.length === 0 && (
          <Text className="text-slate-400 text-center py-4">
            Ya agregaste todos los días disponibles.
          </Text>
        )}
      </View>
    </View>
  </Modal>
);

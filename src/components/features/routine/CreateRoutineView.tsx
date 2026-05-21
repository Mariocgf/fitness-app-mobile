import { DarkSheetLayout } from '@/src/components/common/DarkSheetLayout';
import { ExerciseSearchItem } from '@/src/services/exercise.service';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
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
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*                         CreateRoutineView                                     */
/* ──────────────────────────────────────────────────────────────────────────── */

export const CreateRoutineView: React.FC<CreateRoutineViewProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  /* ── Estado del formulario ─────────────────────────────────────────────── */

  const [name, setName] = useState('');
  const [days, setDays] = useState<CreateRoutineDay[]>([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);

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

  /** Si hay datos cargados, pide confirmación antes de cerrar */
  const handleClose = useCallback(() => {
    const hasData = name.trim().length > 0 || days.length > 0;
    if (hasData) {
      Alert.alert(
        'Salir sin guardar',
        'Tenés cambios sin guardar. ¿Querés salir de todas formas?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: performClose },
        ],
      );
      return;
    }
    performClose();
  }, [name, days, performClose]);

  const containerStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP) }],
    zIndex: 40,
  }));

  /* ── Días disponibles para agregar ─────────────────────────────────────── */

  const usedDayValues = useMemo(() => new Set(days.map((d) => d.value)), [days]);
  const availableDays = useMemo(() => DAYS_MAP.filter((d) => !usedDayValues.has(d.value)), [usedDayValues]);

  /* ── Handlers de días ──────────────────────────────────────────────────── */

  const addDay = useCallback((value: string, label: string) => {
    const newDay: CreateRoutineDay = { id: generateId(), value, label, exercises: [] };
    setDays((prev) => [...prev, newDay]);
    setActiveDayIndex((prev) => prev === 0 && days.length === 0 ? 0 : days.length);
    setIsDayPickerOpen(false);
  }, [days.length]);

  const removeDay = useCallback((dayId: string) => {
    setDays((prev) => {
      const filtered = prev.filter((d) => d.id !== dayId);
      return filtered;
    });
    setActiveDayIndex((prev) => Math.max(0, prev >= days.length - 1 ? days.length - 2 : prev));
  }, [days.length]);

  const handleDayLongPress = useCallback((day: CreateRoutineDay) => {
    Alert.alert(
      'Eliminar día',
      `¿Eliminar ${day.label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeDay(day.id) },
      ],
    );
  }, [removeDay]);

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

  const removeExercise = useCallback((exerciseId: string) => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== activeDayIndex) return day;
        return { ...day, exercises: day.exercises.filter((ex) => ex.id !== exerciseId) };
      }),
    );
  }, [activeDayIndex]);

  /** Agrega un ejercicio seleccionado desde el sheet al día activo */
  const handleAddExercise = useCallback(
    (item: ExerciseSearchItem) => {
      const newExercise: CreateRoutineExercise = {
        id: generateId(),
        exerciseId: item.exerciseId,
        name: item.name,
        gifUrl: item.gifUrl,
        sets: 3,
        reps: 12,
        restSeconds: 60,
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

  /* ── Guardar (no-op) ───────────────────────────────────────────────────── */

  const handleSave = useCallback(() => {
    Alert.alert('Próximamente', 'El endpoint para guardar la rutina aún no está disponible.');
  }, []);

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <Animated.View style={containerStyle} className="bg-slate-100 dark:bg-slate-950">
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
                  Rutina de {days.length} {days.length === 1 ? 'día' : 'días'}
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
                {/* Lista de ejercicios */}
                {activeDay.exercises.map((exercise, idx) => (
                  <ExerciseFormCard
                    key={exercise.id}
                    exercise={exercise}
                    index={idx}
                    onUpdateField={updateExerciseField}
                    onRemove={removeExercise}
                  />
                ))}

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

      {/* Bottom bar: Guardar */}
      <View className="absolute w-full px-4 z-10" style={{ bottom: insets.bottom + 8 }}>
        <TouchableOpacity
          onPress={handleSave}
          className="h-[60px] bg-slate-900 dark:bg-slate-950 rounded-full items-center justify-center"
        >
          <Text className="text-white font-semibold text-base">Guardar</Text>
        </TouchableOpacity>
      </View>

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
  onUpdateField: (
    exerciseId: string,
    field: keyof Pick<CreateRoutineExercise, 'sets' | 'reps' | 'restSeconds'>,
    value: string,
  ) => void;
  onRemove: (exerciseId: string) => void;
}

const ExerciseFormCard: React.FC<ExerciseFormCardProps> = ({
  exercise,
  index,
  onUpdateField,
  onRemove,
}) => {
  /** Render de la acción de swipe derecha (botón eliminar) */
  const renderRightActions = () => (
    <TouchableOpacity
      onPress={() => onRemove(exercise.id)}
      className="bg-red-500 rounded-2xl items-center justify-center px-5 ml-3 mb-3"
    >
      <Ionicons name="trash-outline" size={22} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 mb-3">
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
        </View>

        {/* Fila de inputs numéricos */}
        <View className="flex-row items-center mt-3 gap-4">
          <NumericField
            icon="layers-outline"
            value={exercise.sets}
            onChange={(v) => onUpdateField(exercise.id, 'sets', v)}
          />
          <NumericField
            icon="repeat-outline"
            value={exercise.reps}
            onChange={(v) => onUpdateField(exercise.id, 'reps', v)}
          />
          <NumericField
            icon="time-outline"
            value={exercise.restSeconds}
            onChange={(v) => onUpdateField(exercise.id, 'restSeconds', v)}
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
  icon: string;
  value: number;
  onChange: (value: string) => void;
}

const NumericField: React.FC<NumericFieldProps> = ({ icon, value, onChange }) => (
  <View className="flex-row items-center">
    <Ionicons name={icon as any} size={14} color="#a3e635" />
    <TextInput
      value={value > 0 ? String(value) : ''}
      onChangeText={onChange}
      keyboardType="number-pad"
      placeholder="0"
      placeholderTextColor="#94a3b8"
      className="text-slate-500 dark:text-slate-400 text-xs ml-1 w-8 text-center"
    />
  </View>
);

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

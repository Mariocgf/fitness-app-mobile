import { Routine, RoutineExercise } from '@/src/types/routine';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';
import { formatReps } from '@/src/utils/format.utils';
import { ExerciseDetailView } from '@/src/components/features/routine/ExerciseDetailView';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';

const SkeletonItem = ({ className }: { className?: string }) => {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: 800 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className={`bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
};

cssInterop(Ionicons, {
  className: {
    target: 'style',
    nativeStyleToProp: { color: true },
  },
});

cssInterop(MaterialCommunityIcons, {
  className: {
    target: 'style',
    nativeStyleToProp: { color: true },
  },
});

/* ──────────────────────────────────────────────────────────────────────────── */
/*                              RoutineDetailView                              */
/* ──────────────────────────────────────────────────────────────────────────── */

/** Peso para ordenar los días de la semana cronológicamente */
const getDayWeight = (dayLabel: string): number => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const lower = dayLabel.toLowerCase();
  const index = days.findIndex(d => lower.includes(d));
  return index !== -1 ? index : 99;
};

export interface CardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RoutineDetailViewProps {
  routine: Routine;
  onClose: () => void;
  cardLayout: CardLayout;
  isGenerating?: boolean;
}

/** Altura estimada del tab bar flotante + margen para no tapar contenido */
const TAB_BAR_CLEARANCE = 100;

export const RoutineDetailView: React.FC<RoutineDetailViewProps> = ({
  routine,
  onClose,
  cardLayout,
  isGenerating = false,
}) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  /** Progreso de la animación: 0 = tamaño card, 1 = fullscreen */
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  /** Cierra con animación de contracción hacia la card */
  const handleClose = () => {
    progress.value = withTiming(0, {
      duration: 300,
      easing: Easing.in(Easing.cubic),
    }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  /** Estilo animado del contenedor: interpola de card → fullscreen */
  const containerStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: interpolate(progress.value, [0, 1], [cardLayout.y, 0]),
    left: interpolate(progress.value, [0, 1], [cardLayout.x, 0]),
    width: interpolate(progress.value, [0, 1], [cardLayout.width, screenWidth]),
    height: interpolate(progress.value, [0, 1], [cardLayout.height, screenHeight]),
    borderRadius: interpolate(progress.value, [0, 1], [24, 0]),
    overflow: 'hidden' as const,
    zIndex: 40,
  }));

  /** El contenido interno aparece cuando la expansión está avanzada */
  const contentOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 0.8], [0, 1], Extrapolation.CLAMP),
  }));

  const sortedDays = React.useMemo(() => {
    if (!routine?.days) return [];
    return [...routine.days].sort((a, b) => getDayWeight(a.day) - getDayWeight(b.day));
  }, [routine?.days]);

  if (sortedDays.length === 0) return null;

  const activeDay = sortedDays[activeDayIndex] || sortedDays[0];

  return (
    <Animated.View style={containerStyle} className="bg-[#18181b]">
      {/* Fondo que transiciona del color de la card al color de la vista */}
      <Animated.View
        style={contentOpacity}
        className="absolute inset-0 bg-white dark:bg-zinc-950"
      />

      {/* Contenido con fade-in progresivo */}
      <Animated.View style={[{ flex: 1 }, contentOpacity]}>
        {/* Header con safe area top */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="flex-row items-center px-6 pb-3 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950"
        >
          <TouchableOpacity
            onPress={handleClose}
            className="bg-zinc-100 dark:bg-white/10 p-2 rounded-full mr-3"
          >
            <Ionicons name="arrow-back" size={20} className="text-zinc-700 dark:text-white" />
          </TouchableOpacity>
          <View className="flex-1">
            {isGenerating ? (
              <>
                <SkeletonItem className="w-48 h-6 rounded-md mb-2" />
                <SkeletonItem className="w-32 h-4 rounded-md" />
              </>
            ) : (
              <>
                <Text className="text-zinc-900 dark:text-white text-xl font-bold" numberOfLines={1}>
                  {routine.name}
                </Text>
                <Text className="text-zinc-500 dark:text-zinc-400 text-xs">
                  Rutina de {sortedDays.length} días • Semana 1
                </Text>
              </>
            )}
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {isGenerating ? (
            <View className="px-4 py-4 gap-4" style={{ paddingBottom: TAB_BAR_CLEARANCE + 80 }}>
              <View className="flex-row gap-3 mb-2">
                <SkeletonItem className="w-24 h-10 rounded-full" />
                <SkeletonItem className="w-24 h-10 rounded-full" />
                <SkeletonItem className="w-24 h-10 rounded-full" />
              </View>
              <SkeletonItem className="w-full h-24 rounded-2xl mb-2" />
              <SkeletonItem className="w-full h-28 rounded-2xl" />
              <SkeletonItem className="w-full h-28 rounded-2xl" />
              <SkeletonItem className="w-full h-28 rounded-2xl" />
            </View>
          ) : (
            <>
              {/* Tabs de días */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-4 py-4"
                contentContainerStyle={{ gap: 12 }}
              >
                {sortedDays.map((day, index) => {
                  const isActive = activeDayIndex === index;
                  return (
                    <TouchableOpacity
                      key={day.id}
                      onPress={() => {
                        setActiveDayIndex(index);
                        setSelectedExercise(null);
                      }}
                      className={`px-6 py-2 rounded-full border ${
                        isActive
                          ? 'bg-lime-300 border-lime-300'
                          : 'bg-transparent border-zinc-300 dark:border-white/20'
                      }`}
                    >
                      <Text className={`font-bold ${
                        isActive ? 'text-black' : 'text-zinc-700 dark:text-white'
                      }`}>
                        Día {index + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Resumen del día activo */}
              <View className="mx-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-200 dark:border-white/10">
                <View className="flex-row items-center gap-4">
                  <View className="bg-lime-500/10 dark:bg-lime-500/15 p-3 rounded-xl">
                    <Ionicons name="body-outline" size={32} className="text-zinc-900 dark:text-lime-300" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-zinc-900 dark:text-white font-bold text-lg">
                      {activeDay.day}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="barbell-outline" size={14} className="text-zinc-500 dark:text-zinc-400" />
                      <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1 mr-3">
                        {activeDay.exercises.length} ejercicios
                      </Text>
                      <Ionicons name="time-outline" size={14} className="text-zinc-500 dark:text-zinc-400" />
                      <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">
                        {activeDay.approxTimeSession}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Lista de ejercicios */}
              <View style={{ paddingBottom: TAB_BAR_CLEARANCE + 80 }} className="px-4">
                {activeDay.exercises.map((exercise, idx) => (
                  <TouchableOpacity
                    key={exercise.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedExercise(exercise)}
                    className="flex-row bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 mb-3 border border-zinc-200 dark:border-white/10 items-center"
                  >
                    {exercise.gifUrl ? (
                      <Image
                        source={{ uri: exercise.gifUrl }}
                        className="w-20 h-20 bg-white rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl items-center justify-center">
                        <Ionicons name="image-outline" size={24} className="text-zinc-400" />
                      </View>
                    )}
                    <View className="flex-1 ml-4">
                      <View className="flex-row items-center gap-2 mb-1">
                        <View className="w-6 h-6 rounded-full bg-lime-500/10 dark:bg-lime-500/15 items-center justify-center">
                          <Text className="text-zinc-900 dark:text-lime-300 text-xs font-bold">{idx + 1}</Text>
                        </View>
                        <Text className="text-zinc-900 dark:text-white font-bold text-base flex-1" numberOfLines={1}>
                          {exercise.exercise}
                        </Text>
                      </View>
                      <View className="flex-row items-center flex-wrap gap-3">
                        <View className="flex-row items-center">
                          <Ionicons name="layers-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                          <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.sets}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="repeat-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                          <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{formatReps(exercise)}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                          <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.rest}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="weight" size={12} className="text-zinc-900 dark:text-lime-300" />
                          <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.weight}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} className="text-zinc-400 dark:text-zinc-500" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Botón fijo: Comenzar sesión — con clearance para el tab bar */}
        {!isGenerating && (
          <View
            style={{ bottom: TAB_BAR_CLEARANCE }}
            className="absolute w-full p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-white/10 z-10"
          >
            <TouchableOpacity
              className="bg-lime-300 rounded-2xl p-4 flex-row justify-center items-center gap-2"
              onPress={() => {
                handleClose();
                router.push({
                  pathname: '/session',
                  params: {
                    routineId: routine.id,
                    dayData: JSON.stringify(activeDay),
                  },
                });
              }}
            >
              <Ionicons name="play-circle" size={24} className="text-black" />
              <View className="items-center">
                <Text className="text-black font-bold text-base">
                  Comenzar Día {activeDayIndex + 1}
                </Text>
                <Text className="text-black/60 text-xs">
                  {activeDay.exercises.length} ejercicios • {activeDay.approxTimeSession}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Overlay interno de detalle de ejercicio */}
        {selectedExercise && (
          <ExerciseDetailView
            exercise={selectedExercise}
            onBack={() => setSelectedExercise(null)}
            onClose={() => {
              setSelectedExercise(null);
              handleClose();
            }}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
};
